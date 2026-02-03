import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { supabase } from '../lib/supabase';

export const ProjectDetailScreen = ({ route, navigation }) => {
  const { projectId } = route.params;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [systemCriteria, setSystemCriteria] = useState([]);
  const [projectCriteria, setProjectCriteria] = useState([]);
  const [criteriaValues, setCriteriaValues] = useState({});
  const [allEnums, setAllEnums] = useState({});
  const [selectedCriterion, setSelectedCriterion] = useState(null);
  const [enumModalVisible, setEnumModalVisible] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (user && projectId) {
      loadProjectData();
    }
  }, [user, projectId]);

  const loadProjectData = async () => {
    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      const { data: criteriaData, error: criteriaError } = await supabase
        .from('system_criteria')
        .select('*')
        .order('key');

      if (criteriaError) throw criteriaError;
      setSystemCriteria(criteriaData);

      const { data: projCritData, error: projCritError } = await supabase
        .from('project_criteria')
        .select('*')
        .eq('project_id', projectId);

      if (projCritError) throw projCritError;

      if (!projCritData || projCritData.length === 0) {
        const newCriteria = await initializeProjectCriteria(criteriaData);
        if (newCriteria && newCriteria.length > 0) {
          await loadCriteriaValues(newCriteria);
        }
      } else {
        setProjectCriteria(projCritData);
        await loadCriteriaValues(projCritData);
      }

      const { data: enumsData, error: enumsError } = await supabase
        .from('all_enums')
        .select('*')
        .order('enum_name')
        .order('sort_order');

      if (enumsError) throw enumsError;

      const enumsMap = {};
      enumsData.forEach(e => {
        if (!enumsMap[e.enum_name]) {
          enumsMap[e.enum_name] = [];
        }
        enumsMap[e.enum_name].push(e.enum_value);
      });
      setAllEnums(enumsMap);

    } catch (error) {
      Alert.alert('Error', 'Failed to load project: ' + error.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const initializeProjectCriteria = async (criteria) => {
    try {
      const insertData = criteria.map(c => ({
        project_id: projectId,
        criterion_key: c.key,
        preference_level: 'optional',
      }));

      const { data, error } = await supabase
        .from('project_criteria')
        .insert(insertData)
        .select();

      if (error) throw error;
      
      setProjectCriteria(data || []);
      return data;
    } catch (error) {
      console.error('Error initializing criteria:', error);
      return [];
    }
  };

  const loadCriteriaValues = async (projCriteria) => {
    try {
      const { data, error } = await supabase
        .from('project_criteria_values')
        .select('*')
        .in('project_criterion_id', projCriteria.map(pc => pc.id));

      if (error) throw error;

      const valuesMap = {};
      data?.forEach(v => {
        valuesMap[v.project_criterion_id] = v;
      });
      setCriteriaValues(valuesMap);
    } catch (error) {
      console.error('Error loading criteria values:', error);
    }
  };

  const updatePreferenceLevel = async (criterionId, level) => {
    try {
      const { error } = await supabase
        .from('project_criteria')
        .update({ preference_level: level })
        .eq('id', criterionId);

      if (error) throw error;

      setProjectCriteria(prev =>
        prev.map(pc => pc.id === criterionId ? { ...pc, preference_level: level } : pc)
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update: ' + error.message);
    }
  };

  const updateCriteriaValue = async (projectCriterionId, valueField, value) => {
    try {
      const existingValue = criteriaValues[projectCriterionId];
      const updateData = {
        project_criterion_id: projectCriterionId,
        [valueField]: value,
      };

      if (existingValue) {
        const { error } = await supabase
          .from('project_criteria_values')
          .update(updateData)
          .eq('id', existingValue.id);

        if (error) throw error;
        
        setCriteriaValues(prev => ({
          ...prev,
          [projectCriterionId]: { ...existingValue, [valueField]: value }
        }));
      } else {
        const { data, error } = await supabase
          .from('project_criteria_values')
          .insert(updateData)
          .select()
          .single();

        if (error) throw error;
        setCriteriaValues(prev => ({ ...prev, [projectCriterionId]: data }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save: ' + error.message);
    }
  };

  const getEnumValuesForCriterion = (criterionKey) => {
    const enumMapping = {
      'condition': 'overall_condition_enum',
      'energy_rating': 'energy_rating_enum',
      'location_context': 'area_type_enum',
      'parking_ease': 'parking_ease_enum',
      'property_type': 'property_type_enum',
      'shops_access': 'distance_access_enum',
      'transport_access': 'distance_access_enum',
    };

    const enumName = enumMapping[criterionKey];
    return allEnums[enumName] || [];
  };

  const openEnumPicker = (criterion, projectCriterion) => {
    setSelectedCriterion({ criterion, projectCriterion });
    setEnumModalVisible(true);
  };

  const selectEnumValue = (value) => {
    if (selectedCriterion) {
      updateCriteriaValue(selectedCriterion.projectCriterion.id, 'value_enum', value);
      setEnumModalVisible(false);
      setSelectedCriterion(null);
    }
  };

  const renderCriterionInput = (criterion, projectCriterion) => {
    const value = criteriaValues[projectCriterion.id];

    switch (criterion.value_type) {
      case 'boolean':
        return (
          <View style={styles.booleanContainer}>
            <TouchableOpacity
              style={[styles.booleanButton, value?.value_bool === true && styles.booleanButtonActive]}
              onPress={() => updateCriteriaValue(projectCriterion.id, 'value_bool', true)}
            >
              <Text style={[styles.booleanText, value?.value_bool === true && styles.booleanTextActive]}>
                Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.booleanButton, value?.value_bool === false && styles.booleanButtonActive]}
              onPress={() => updateCriteriaValue(projectCriterion.id, 'value_bool', false)}
            >
              <Text style={[styles.booleanText, value?.value_bool === false && styles.booleanTextActive]}>
                No
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'number':
      case 'range':
        return (
          <View style={styles.rangeContainer}>
            <TextInput
              style={styles.rangeInput}
              placeholder="Min"
              value={value?.value_min?.toString() || ''}
              onChangeText={(text) => updateCriteriaValue(projectCriterion.id, 'value_min', parseFloat(text) || null)}
              keyboardType="numeric"
            />
            <Text style={styles.rangeSeparator}>-</Text>
            <TextInput
              style={styles.rangeInput}
              placeholder="Max"
              value={value?.value_max?.toString() || ''}
              onChangeText={(text) => updateCriteriaValue(projectCriterion.id, 'value_max', parseFloat(text) || null)}
              keyboardType="numeric"
            />
          </View>
        );

      case 'enum':
        return (
          <TouchableOpacity
            style={styles.enumButton}
            onPress={() => openEnumPicker(criterion, projectCriterion)}
          >
            <Text style={styles.enumButtonText}>
              {value?.value_enum || 'Select value'}
            </Text>
          </TouchableOpacity>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} testID="back-button">
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{project?.title}</Text>
          <Text style={styles.headerSubtitle}>{project?.project_type.toUpperCase()} project</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.sectionTitle}>Criteria Preferences</Text>
        <Text style={styles.sectionSubtitle}>
          Set your preferences for each criterion
        </Text>

        {systemCriteria.map(criterion => {
          const projectCriterion = projectCriteria.find(pc => pc.criterion_key === criterion.key);
          if (!projectCriterion) return null;

          return (
            <View key={criterion.key} style={styles.criterionCard}>
              <Text style={styles.criterionLabel}>{criterion.label}</Text>
              <Text style={styles.criterionType}>Type: {criterion.value_type}</Text>

              <Text style={styles.inputLabel}>Importance</Text>
              <View style={styles.importanceButtons}>
                {['required', 'preferred', 'optional'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.importanceButton,
                      projectCriterion.preference_level === level && styles.importanceButtonActive,
                    ]}
                    onPress={() => updatePreferenceLevel(projectCriterion.id, level)}
                  >
                    <Text
                      style={[
                        styles.importanceText,
                        projectCriterion.preference_level === level && styles.importanceTextActive,
                      ]}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Preference Value</Text>
              {renderCriterionInput(criterion, projectCriterion)}
            </View>
          );
        })}
      </ScrollView>

      <Modal
        visible={!!enumModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEnumModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.enumModalContent}>
            <Text style={styles.modalTitle}>
              Select {selectedCriterion?.criterion.label}
            </Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedCriterion && getEnumValuesForCriterion(selectedCriterion.criterion.key).map((enumValue) => (
                <TouchableOpacity
                  key={enumValue}
                  style={styles.enumOption}
                  onPress={() => selectEnumValue(enumValue)}
                >
                  <Text style={styles.enumOptionText}>{enumValue}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setEnumModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    fontSize: 16,
    color: '#000',
    marginBottom: 12,
  },
  headerInfo: {
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  criterionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  criterionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  criterionType: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  importanceButtons: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  importanceButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  importanceButtonActive: {
    backgroundColor: '#000',
  },
  importanceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  importanceTextActive: {
    color: '#fff',
  },
  booleanContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  booleanButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  booleanButtonActive: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
  booleanText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  booleanTextActive: {
    color: '#fff',
  },
  rangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rangeInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  rangeSeparator: {
    fontSize: 16,
    color: '#666',
  },
  enumButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  enumButtonText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  enumModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 20,
  },
  enumOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  enumOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  closeButton: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});

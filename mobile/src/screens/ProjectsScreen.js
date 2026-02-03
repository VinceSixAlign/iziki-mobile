import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const ProjectsScreen = ({ navigation }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    project_type: 'buy',
    urgency_level: 'medium',
    budget_target: '',
    budget_max: '',
  });
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load projects: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!formData.title) {
      Alert.alert('Error', 'Please enter a project title');
      return;
    }

    setCreating(true);
    try {
      const projectData = {
        title: formData.title,
        project_type: formData.project_type,
        project_status: 'active',
        urgency_level: formData.urgency_level,
        budget_target: formData.budget_target ? parseInt(formData.budget_target) : null,
        budget_max: formData.budget_max ? parseInt(formData.budget_max) : null,
        currency: 'EUR',
        owner_id: user.id,
      };

      const { data, error } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();

      if (error) throw error;

      Alert.alert('Success', 'Project created');
      setModalVisible(false);
      setFormData({ title: '', project_type: 'buy', urgency_level: 'medium', budget_target: '', budget_max: '' });
      fetchProjects();
    } catch (error) {
      Alert.alert('Error', 'Failed to create project: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const renderProject = ({ item }) => (
    <TouchableOpacity
      style={styles.projectCard}
      onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id })}
      testID={`project-card-${item.id}`}
    >
      <Text style={styles.projectTitle}>{item.title}</Text>
      <Text style={styles.projectMeta}>
        {item.project_type.toUpperCase()} • {item.urgency_level} urgency
      </Text>
      {item.budget_target && (
        <Text style={styles.projectBudget}>
          Budget: €{item.budget_target.toLocaleString()}
          {item.budget_max && ` - €${item.budget_max.toLocaleString()}`}
        </Text>
      )}
      <Text style={styles.projectDate}>
        Created {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>My Projects</Text>
        <TouchableOpacity onPress={handleSignOut} testID="sign-out-button">
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {projects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No projects yet</Text>
          <Text style={styles.emptySubtext}>Create your first project to get started</Text>
        </View>
      ) : (
        <FlatList
          data={projects}
          renderItem={renderProject}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        testID="create-project-button"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={!!modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>New Project</Text>

              <Text style={styles.inputLabel}>Project Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Family Home Search"
                value={formData.title}
                onChangeText={(text) => setFormData({ ...formData, title: text })}
                testID="project-title-input"
              />

              <Text style={styles.inputLabel}>Project Type</Text>
              <View style={styles.segmentedControl}>
                {['buy', 'rent', 'invest'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.segmentButton,
                      formData.project_type === type && styles.segmentButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, project_type: type })}
                    testID={`project-type-${type}`}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        formData.project_type === type && styles.segmentTextActive,
                      ]}
                    >
                      {type.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Urgency Level</Text>
              <View style={styles.segmentedControl}>
                {['low', 'medium', 'high'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.segmentButton,
                      formData.urgency_level === level && styles.segmentButtonActive,
                    ]}
                    onPress={() => setFormData({ ...formData, urgency_level: level })}
                    testID={`urgency-${level}`}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        formData.urgency_level === level && styles.segmentTextActive,
                      ]}
                    >
                      {level.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Target Budget (EUR)</Text>
              <TextInput
                style={styles.input}
                placeholder="250000"
                value={formData.budget_target}
                onChangeText={(text) => setFormData({ ...formData, budget_target: text })}
                keyboardType="numeric"
                testID="budget-target-input"
              />

              <Text style={styles.inputLabel}>Max Budget (EUR)</Text>
              <TextInput
                style={styles.input}
                placeholder="300000"
                value={formData.budget_max}
                onChangeText={(text) => setFormData({ ...formData, budget_max: text })}
                keyboardType="numeric"
                testID="budget-max-input"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.createButton, creating && styles.buttonDisabled]}
                  onPress={handleCreateProject}
                  disabled={!!creating}
                  testID="submit-project-button"
                >
                  <Text style={styles.createButtonText}>
                    {creating ? 'Creating...' : 'Create'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  signOutText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  listContent: {
    padding: 20,
  },
  projectCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  projectMeta: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  projectBudget: {
    fontSize: 14,
    color: '#1a1a1a',
    marginBottom: 4,
  },
  projectDate: {
    fontSize: 12,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  segmentedControl: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  segmentButtonActive: {
    backgroundColor: '#000',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  segmentTextActive: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  createButton: {
    backgroundColor: '#000',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

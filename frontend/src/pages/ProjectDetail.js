import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import { ArrowLeft, Save } from 'lucide-react';

export const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [project, setProject] = useState(null);
  const [systemCriteria, setSystemCriteria] = useState([]);
  const [projectCriteria, setProjectCriteria] = useState([]);
  const [criteriaValues, setCriteriaValues] = useState({});
  const [allEnums, setAllEnums] = useState({});

  useEffect(() => {
    if (user && projectId) {
      loadProjectData();
    }
  }, [user, projectId]);

  const loadProjectData = async () => {
    try {
      // Load project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Load system criteria
      const { data: criteriaData, error: criteriaError } = await supabase
        .from('system_criteria')
        .select('*')
        .order('key');

      if (criteriaError) throw criteriaError;
      setSystemCriteria(criteriaData);

      // Load project criteria
      const { data: projCritData, error: projCritError } = await supabase
        .from('project_criteria')
        .select('*')
        .eq('project_id', projectId);

      if (projCritError) throw projCritError;

      // If no criteria exist yet, initialize them
      if (!projCritData || projCritData.length === 0) {
        const newCriteria = await initializeProjectCriteria(criteriaData);
        if (newCriteria && newCriteria.length > 0) {
          await loadCriteriaValues(newCriteria);
        }
      } else {
        setProjectCriteria(projCritData);
        await loadCriteriaValues(projCritData);
      }

      // Load all enums
      const { data: enumsData, error: enumsError } = await supabase
        .from('all_enums')
        .select('*')
        .order('enum_name')
        .order('sort_order');

      if (enumsError) throw enumsError;

      // Group enums by name
      const enumsMap = {};
      enumsData.forEach(e => {
        if (!enumsMap[e.enum_name]) {
          enumsMap[e.enum_name] = [];
        }
        enumsMap[e.enum_name].push(e.enum_value);
      });
      setAllEnums(enumsMap);

    } catch (error) {
      toast.error('Failed to load project: ' + error.message);
      navigate('/projects');
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
      toast.error('Failed to initialize criteria: ' + error.message);
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
      toast.success('Preference level updated');
    } catch (error) {
      toast.error('Failed to update: ' + error.message);
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
        // Update existing
        const { error } = await supabase
          .from('project_criteria_values')
          .update(updateData)
          .eq('id', existingValue.id);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('project_criteria_values')
          .insert(updateData)
          .select()
          .single();

        if (error) throw error;
        setCriteriaValues(prev => ({ ...prev, [projectCriterionId]: data }));
      }

      toast.success('Value saved');
    } catch (error) {
      toast.error('Failed to save: ' + error.message);
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

  const renderCriterionInput = (criterion, projectCriterion) => {
    const value = criteriaValues[projectCriterion.id];

    switch (criterion.value_type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value?.value_bool || false}
              onCheckedChange={(checked) => updateCriteriaValue(projectCriterion.id, 'value_bool', checked)}
              data-testid={`criterion-${criterion.key}-checkbox`}
            />
            <Label>Required</Label>
          </div>
        );

      case 'number':
        return (
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={value?.value_min || ''}
              onChange={(e) => updateCriteriaValue(projectCriterion.id, 'value_min', parseFloat(e.target.value) || null)}
              data-testid={`criterion-${criterion.key}-min-input`}
            />
            <Input
              type="number"
              placeholder="Max"
              value={value?.value_max || ''}
              onChange={(e) => updateCriteriaValue(projectCriterion.id, 'value_max', parseFloat(e.target.value) || null)}
              data-testid={`criterion-${criterion.key}-max-input`}
            />
          </div>
        );

      case 'range':
        return (
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Min"
              value={value?.value_min || ''}
              onChange={(e) => updateCriteriaValue(projectCriterion.id, 'value_min', parseFloat(e.target.value) || null)}
              data-testid={`criterion-${criterion.key}-min-input`}
            />
            <Input
              type="number"
              placeholder="Max"
              value={value?.value_max || ''}
              onChange={(e) => updateCriteriaValue(projectCriterion.id, 'value_max', parseFloat(e.target.value) || null)}
              data-testid={`criterion-${criterion.key}-max-input`}
            />
          </div>
        );

      case 'enum':
        const enumValues = getEnumValuesForCriterion(criterion.key);
        return (
          <Select
            value={value?.value_enum || ''}
            onValueChange={(val) => updateCriteriaValue(projectCriterion.id, 'value_enum', val)}
          >
            <SelectTrigger data-testid={`criterion-${criterion.key}-select`}>
              <SelectValue placeholder="Select value" />
            </SelectTrigger>
            <SelectContent>
              {enumValues.map(ev => (
                <SelectItem key={ev} value={ev}>{ev}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-neutral-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button variant="ghost" onClick={() => navigate('/projects')} className="mb-2" data-testid="back-to-projects-button">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
          <h1 className="text-2xl font-semibold text-neutral-900">{project?.title}</h1>
          <p className="text-sm text-neutral-600 mt-1">
            <span className="capitalize">{project?.project_type}</span> project
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Criteria Preferences</CardTitle>
            <CardDescription>
              Set your preferences for each criterion. These will be used to evaluate properties.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {systemCriteria.map(criterion => {
                const projectCriterion = projectCriteria.find(pc => pc.criterion_key === criterion.key);
                if (!projectCriterion) return null;

                return (
                  <div key={criterion.key} className="border-b border-neutral-200 pb-4 last:border-0" data-testid={`criterion-row-${criterion.key}`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-base font-medium">{criterion.label}</Label>
                        <p className="text-xs text-neutral-500 mt-1">
                          Type: {criterion.value_type}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm mb-2 block">Importance</Label>
                        <Select
                          value={projectCriterion.preference_level}
                          onValueChange={(value) => updatePreferenceLevel(projectCriterion.id, value)}
                        >
                          <SelectTrigger data-testid={`criterion-${criterion.key}-importance-select`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="required">Required</SelectItem>
                            <SelectItem value="preferred">Preferred</SelectItem>
                            <SelectItem value="optional">Optional</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-sm mb-2 block">Preference Value</Label>
                        {renderCriterionInput(criterion, projectCriterion)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
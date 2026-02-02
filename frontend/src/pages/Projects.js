import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { PlusCircle } from 'lucide-react';

export const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    project_type: 'buy',
    urgency_level: 'medium',
    budget_target: '',
    budget_max: '',
  });
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
      toast.error('Failed to load projects: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
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

      toast.success('Project created successfully');
      setShowDialog(false);
      setFormData({ title: '', project_type: 'buy', urgency_level: 'medium', budget_target: '', budget_max: '' });
      fetchProjects();
    } catch (error) {
      toast.error('Failed to create project: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      toast.error('Failed to sign out');
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-neutral-900">Real Estate Decision Assistant</h1>
          <Button variant="outline" onClick={handleSignOut} data-testid="sign-out-button">
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-neutral-900">My Projects</h2>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button data-testid="create-project-button">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>Set up a new real estate decision project</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Family Home Search"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    data-testid="project-title-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project_type">Project Type</Label>
                  <Select
                    value={formData.project_type}
                    onValueChange={(value) => setFormData({ ...formData, project_type: value })}
                  >
                    <SelectTrigger id="project_type" data-testid="project-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="rent">Rent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urgency_level">Urgency Level</Label>
                  <Select
                    value={formData.urgency_level}
                    onValueChange={(value) => setFormData({ ...formData, urgency_level: value })}
                  >
                    <SelectTrigger id="urgency_level" data-testid="urgency-level-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget_target">Target Budget (EUR)</Label>
                    <Input
                      id="budget_target"
                      type="number"
                      placeholder="250000"
                      value={formData.budget_target}
                      onChange={(e) => setFormData({ ...formData, budget_target: e.target.value })}
                      data-testid="budget-target-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget_max">Max Budget (EUR)</Label>
                    <Input
                      id="budget_max"
                      type="number"
                      placeholder="300000"
                      value={formData.budget_max}
                      onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                      data-testid="budget-max-input"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating} data-testid="submit-project-button">
                    {creating ? 'Creating...' : 'Create Project'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {projects.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-neutral-600 mb-4">No projects yet. Create your first project to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer hover:border-neutral-400 transition-colors"
                onClick={() => navigate(`/projects/${project.id}`)}
                data-testid={`project-card-${project.id}`}
              >
                <CardHeader>
                  <CardTitle>{project.title}</CardTitle>
                  <CardDescription>
                    <span className="capitalize">{project.project_type}</span> • {project.urgency_level} urgency
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {project.budget_target && (
                    <p className="text-sm text-neutral-600">
                      Budget: €{project.budget_target.toLocaleString()}
                      {project.budget_max && ` - €${project.budget_max.toLocaleString()}`}
                    </p>
                  )}
                  <p className="text-xs text-neutral-500 mt-2">
                    Created {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
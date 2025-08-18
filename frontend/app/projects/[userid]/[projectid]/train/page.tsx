'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '../../../../../components/Header';
import config from '../../../../../lib/config';
import { 
  getSessionIdFromMaskedId, 
  isMaskedId, 
  isSessionId, 
  generateMaskedId, 
  storeMaskedIdMapping,
  getProjectIdFromMaskedId,
  isMaskedProjectId,
  isProjectId
} from '../../../../../lib/session-utils';

interface GuestSession {
  session_id: string;
  createdAt: string;
  expiresAt: string;
  active: boolean;
  ip_address?: string;
  user_agent?: string;
  last_active?: string;
}

interface GuestSessionResponse {
  success: boolean;
  data: GuestSession;
}

interface Project {
  id: string;
  name: string;
  type: string;
  createdAt: string;
  description?: string;
  status?: string;
  maskedId?: string;
}

interface Example {
  id: string;
  text: string;
  createdAt: string;
}

interface Label {
  id: string;
  name: string;
  examples: Example[];
  createdAt: string;
}

export default function TrainPage() {
  const [labels, setLabels] = useState<Label[]>([]);
  const [showAddLabelModal, setShowAddLabelModal] = useState(false);
  const [showAddExampleModal, setShowAddExampleModal] = useState(false);
  const [selectedLabelId, setSelectedLabelId] = useState<string>('');
  const [newLabelName, setNewLabelName] = useState('');
  const [newExampleText, setNewExampleText] = useState('');
  const [guestSession, setGuestSession] = useState<GuestSession | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidSession, setIsValidSession] = useState(false);
  const [actualSessionId, setActualSessionId] = useState<string>('');
  const [actualProjectId, setActualProjectId] = useState<string>('');
  const [pendingExamples, setPendingExamples] = useState<{[labelId: string]: Example[]}>({});
  const [isSubmittingToAPI, setIsSubmittingToAPI] = useState(false);

  const params = useParams();
  const urlUserId = params?.userid as string;
  const urlProjectId = params?.projectid as string;

  useEffect(() => {
    validateGuestSession();
  }, [urlUserId, urlProjectId]); // eslint-disable-line react-hooks/exhaustive-deps

  const validateGuestSession = async () => {
    if (!urlUserId || !urlProjectId) {
      setIsLoading(false);
      return;
    }

    try {
      let sessionId: string;
      let projectId: string;

      // Check if URL param is a masked ID or full session ID
      if (isMaskedId(urlUserId)) {
        const realSessionId = getSessionIdFromMaskedId(urlUserId);
        if (!realSessionId) {
          window.location.href = '/projects';
          return;
        }
        sessionId = realSessionId;
      } else if (isSessionId(urlUserId)) {
        const maskedId = generateMaskedId(urlUserId);
        storeMaskedIdMapping(maskedId, urlUserId);
        window.location.href = `/projects/${maskedId}/${urlProjectId}/train`;
        return;
      } else {
        window.location.href = '/projects';
        return;
      }

      // Check if project ID is masked
      if (isMaskedProjectId(urlProjectId)) {
        const realProjectId = getProjectIdFromMaskedId(urlProjectId);
        if (!realProjectId) {
          window.location.href = `/projects/${urlUserId}`;
          return;
        }
        projectId = realProjectId;
      } else if (isProjectId(urlProjectId)) {
        projectId = urlProjectId;
      } else {
        window.location.href = `/projects/${urlUserId}`;
        return;
      }

      // Check if session exists in localStorage
      const storedSessionId = localStorage.getItem('neural_playground_session_id');
      
      if (!storedSessionId) {
        window.location.href = '/projects';
        return;
      }

      if (storedSessionId !== sessionId) {
        const correctMaskedId = generateMaskedId(storedSessionId);
        storeMaskedIdMapping(correctMaskedId, storedSessionId);
        window.location.href = `/projects/${correctMaskedId}`;
        return;
      }

      // Validate session with backend API
      const response = await fetch(`${config.apiBaseUrl}${config.api.guests.sessionById(sessionId)}`);
      
      if (response.ok) {
        const sessionResponse: GuestSessionResponse = await response.json();
        if (sessionResponse.success && sessionResponse.data.active) {
          const now = new Date();
          const expiresAt = new Date(sessionResponse.data.expiresAt);
          
          if (now < expiresAt) {
            setActualSessionId(sessionId);
            setActualProjectId(projectId);
            setGuestSession(sessionResponse.data);
            setIsValidSession(true);
            
            // Load project and labels after setting session as valid
            await loadProjectAndLabels(sessionId, projectId);
          } else {
            console.error('Session expired');
            localStorage.removeItem('neural_playground_session_id');
            localStorage.removeItem('neural_playground_session_created');
            window.location.href = '/projects';
            return;
          }
        } else {
          console.error('Session inactive');
          localStorage.removeItem('neural_playground_session_id');
          localStorage.removeItem('neural_playground_session_created');
          window.location.href = '/projects';
          return;
        }
      } else {
        console.error('Session validation failed:', response.status);
        localStorage.removeItem('neural_playground_session_id');
        localStorage.removeItem('neural_playground_session_created');
        window.location.href = '/projects';
        return;
      }
    } catch (error) {
      console.error('Error validating session:', error);
      localStorage.removeItem('neural_playground_session_id');
      localStorage.removeItem('neural_playground_session_created');
      window.location.href = '/projects';
      return;
    }
    setIsLoading(false);
  };

  const loadProjectAndLabels = async (sessionId: string, projectId: string) => {
    try {
      console.log('Loading project and labels for session:', sessionId, 'project:', projectId);
      
      // Load all projects for the session and find the specific project
      const response = await fetch(`${config.apiBaseUrl}/api/guests/session/${sessionId}/projects`);
      
      if (response.ok) {
        const projectsResponse = await response.json();
        console.log('Projects response:', projectsResponse);
        
        if (projectsResponse.success && projectsResponse.data) {
          console.log('Available projects:', projectsResponse.data.map((p: Project) => ({ id: p.id, name: p.name })));
          
          // Find the specific project by ID
          const project = projectsResponse.data.find((p: Project) => p.id === projectId);
          
          if (project) {
            console.log('Found project:', project);
            setSelectedProject(project);
            
            // Load labels for this project (for now, use localStorage until API is available)
            const labelsKey = `neural_playground_labels_${sessionId}_${projectId}`;
            const savedLabels = localStorage.getItem(labelsKey);
            if (savedLabels) {
              setLabels(JSON.parse(savedLabels));
            }
          } else {
            // Project not found in the session's projects
            console.error('Project not found in session projects. Looking for:', projectId);
            console.error('Available project IDs:', projectsResponse.data.map((p: Project) => p.id));
            window.location.href = `/projects/${urlUserId}`;
            return;
          }
        } else {
          // No projects found or empty response
          console.error('No projects found for session or invalid response structure');
          window.location.href = `/projects/${urlUserId}`;
          return;
        }
      } else {
        // Failed to load projects
        console.error('Failed to load session projects:', response.status);
        window.location.href = `/projects/${urlUserId}`;
        return;
      }
    } catch (error) {
      console.error('Error loading project and labels:', error);
      window.location.href = `/projects/${urlUserId}`;
      return;
    }
  };

  const saveLabels = (sessionId: string, projectId: string, labelsData: Label[]) => {
    try {
      const labelsKey = `neural_playground_labels_${sessionId}_${projectId}`;
      localStorage.setItem(labelsKey, JSON.stringify(labelsData));
    } catch (error) {
      console.error('Error saving labels:', error);
    }
  };

  const submitExamplesToAPI = async (labelName: string, examples: Example[]) => {
    // Validation checks
    if (!actualSessionId || !actualProjectId) {
      console.log('Missing session or project ID:', { actualSessionId, actualProjectId });
      return false;
    }

    if (examples.length === 0) {
      console.log('No examples to submit');
      return false;
    }

    if (!labelName || labelName.trim().length === 0) {
      console.error('Label name is empty or invalid:', labelName);
      alert('Label name cannot be empty');
      return false;
    }

    // Filter out empty examples
    const validExamples = examples.filter(example => 
      example && example.text && example.text.trim().length > 0
    );

    if (validExamples.length === 0) {
      console.log('No valid examples to submit after filtering');
      return false;
    }

    try {
      setIsSubmittingToAPI(true);
      
      // Try the original format first
      const payload = {
        label: labelName.trim(),
        examples: validExamples.map(example => example.text.trim())
      };

      // Alternative payload formats to test if the first one fails
      const alternativePayloads = [
        // Alternative 1: Different field names
        {
          labelName: labelName.trim(),
          exampleTexts: validExamples.map(example => example.text.trim())
        },
        // Alternative 2: Nested structure
        {
          data: {
            label: labelName.trim(),
            examples: validExamples.map(example => example.text.trim())
          }
        },
        // Alternative 3: Array format
        validExamples.map(example => ({
          label: labelName.trim(),
          text: example.text.trim()
        }))
      ];

      console.log('=== API Submission Debug ===');
      console.log('Session ID:', actualSessionId);
      console.log('Project ID:', actualProjectId);
      console.log('Label Name:', labelName);
      console.log('Original Examples Count:', examples.length);
      console.log('Valid Examples Count:', validExamples.length);
      console.log('Primary Payload:', JSON.stringify(payload, null, 2));
      console.log('Alternative Payloads:', alternativePayloads.map((p, i) => `Alt ${i + 1}: ${JSON.stringify(p, null, 2)}`));
      console.log('Payload Size (bytes):', new Blob([JSON.stringify(payload)]).size);
      
      const apiUrl = `${config.apiBaseUrl}${config.api.guests.examples(actualSessionId, actualProjectId)}`;
      console.log('API URL:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response Status:', response.status);
      console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Successfully submitted examples to API:', result);
        return true;
      } else {
        console.error('❌ Failed to submit examples to API:', response.status);
        
        let errorDetails;
        try {
          errorDetails = await response.json();
          console.error('Error JSON Response:', errorDetails);
        } catch (jsonError) {
          const errorText = await response.text();
          console.error('Error Text Response:', errorText);
          errorDetails = { message: errorText };
        }

        // Show user-friendly error
        if (response.status === 422) {
          alert(`Validation Error: ${errorDetails.message || 'Invalid data format. Please check your label name and examples.'}`);
        } else {
          alert(`API Error (${response.status}): ${errorDetails.message || 'Failed to submit examples'}`);
        }

        return false;
      }
    } catch (error) {
      console.error('❌ Network error submitting examples to API:', error);
      alert('Network error: Failed to connect to the server. Please check your connection.');
      return false;
    } finally {
      setIsSubmittingToAPI(false);
    }
  };

  const processPendingExamples = async (labelId: string, labelName: string) => {
    const pending = pendingExamples[labelId] || [];
    if (pending.length >= 6) {
      // Submit in batches of 6
      const batches = [];
      for (let i = 0; i < pending.length; i += 6) {
        batches.push(pending.slice(i, i + 6));
      }

      for (const batch of batches) {
        const success = await submitExamplesToAPI(labelName, batch);
        if (success) {
          // Remove submitted examples from pending
          setPendingExamples(prev => ({
            ...prev,
            [labelId]: prev[labelId]?.filter(ex => !batch.some(b => b.id === ex.id)) || []
          }));
        }
      }
    }
  };

  const handleAddLabel = async () => {
    if (newLabelName.trim() && actualSessionId && actualProjectId) {
      const newLabel: Label = {
        id: `label-${Date.now()}`,
        name: newLabelName.trim(),
        examples: [],
        createdAt: new Date().toLocaleDateString()
      };
      
      const updatedLabels = [...labels, newLabel];
      setLabels(updatedLabels);
      saveLabels(actualSessionId, actualProjectId, updatedLabels);
      
      // Initialize pending examples for this label
      setPendingExamples(prev => ({
        ...prev,
        [newLabel.id]: []
      }));

      // Submit label to API immediately (but only if we have examples to submit)
      // Don't submit empty labels to API as they might cause validation errors
      console.log('Label created locally, will submit to API when examples are added');
      
      setNewLabelName('');
      setShowAddLabelModal(false);
    }
  };

  const handleAddExample = async () => {
    if (newExampleText.trim() && selectedLabelId && actualSessionId && actualProjectId) {
      const newExample: Example = {
        id: `example-${Date.now()}`,
        text: newExampleText.trim(),
        createdAt: new Date().toLocaleDateString()
      };
      
      const updatedLabels = labels.map(label => {
        if (label.id === selectedLabelId) {
          return {
            ...label,
            examples: [...label.examples, newExample]
          };
        }
        return label;
      });
      
      setLabels(updatedLabels);
      saveLabels(actualSessionId, actualProjectId, updatedLabels);

      // Add to pending examples for batching
      setPendingExamples(prev => ({
        ...prev,
        [selectedLabelId]: [...(prev[selectedLabelId] || []), newExample]
      }));

      // Find the label name for API submission
      const label = labels.find(l => l.id === selectedLabelId);
      if (label) {
        // Check if we should submit to API (every 6 examples)
        const currentPending = pendingExamples[selectedLabelId] || [];
        const totalPending = currentPending.length + 1; // +1 for the example we just added

        if (totalPending >= 6) {
          await processPendingExamples(selectedLabelId, label.name);
        }
      }
      
      setNewExampleText('');
      setSelectedLabelId('');
      setShowAddExampleModal(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, labelId: string) => {
    const file = event.target.files?.[0];
    if (!file || !actualSessionId || !actualProjectId) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (text) {
        // Split text by lines and filter out empty lines
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        
        const newExamples: Example[] = lines.map(line => ({
          id: `example-${Date.now()}-${Math.random()}`,
          text: line.trim(),
          createdAt: new Date().toLocaleDateString()
        }));

        const updatedLabels = labels.map(label => {
          if (label.id === labelId) {
            return {
              ...label,
              examples: [...label.examples, ...newExamples]
            };
          }
          return label;
        });
        
        setLabels(updatedLabels);
        saveLabels(actualSessionId, actualProjectId, updatedLabels);

        // Add all new examples to pending for batching
        setPendingExamples(prev => ({
          ...prev,
          [labelId]: [...(prev[labelId] || []), ...newExamples]
        }));

        // Find the label name and process batches
        const label = labels.find(l => l.id === labelId);
        if (label) {
          // Process all pending examples in batches
          await processPendingExamples(labelId, label.name);
        }
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  const handleDeleteLabel = (labelId: string) => {
    if (actualSessionId && actualProjectId) {
      const updatedLabels = labels.filter(label => label.id !== labelId);
      setLabels(updatedLabels);
      saveLabels(actualSessionId, actualProjectId, updatedLabels);
    }
  };

  const handleDeleteExample = (labelId: string, exampleId: string) => {
    if (actualSessionId && actualProjectId) {
      const updatedLabels = labels.map(label => {
        if (label.id === labelId) {
          return {
            ...label,
            examples: label.examples.filter(example => example.id !== exampleId)
          };
        }
        return label;
      });
      
      setLabels(updatedLabels);
      saveLabels(actualSessionId, actualProjectId, updatedLabels);
    }
  };

  const openAddExampleModal = (labelId: string) => {
    setSelectedLabelId(labelId);
    setShowAddExampleModal(true);
  };

  const submitAllPendingExamples = async () => {
    for (const [labelId, examples] of Object.entries(pendingExamples)) {
      if (examples.length > 0) {
        const label = labels.find(l => l.id === labelId);
        if (label) {
          await submitExamplesToAPI(label.name, examples);
          // Clear pending examples after submission
          setPendingExamples(prev => ({
            ...prev,
            [labelId]: []
          }));
        }
      }
    }
  };

  // Submit remaining examples when component unmounts
  useEffect(() => {
    return () => {
      // This will run when component unmounts
      submitAllPendingExamples();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps



  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1c1c1c] text-white">
        <Header />
        <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-white text-xl">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!isValidSession || !selectedProject) {
    return (
      <div className="min-h-screen bg-[#1c1c1c] text-white">
        <Header />
        <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Invalid Session or Project
            </h1>
            <p className="text-lg text-white mb-8">
              Please return to your projects and try again.
            </p>
            <a 
              href={`/projects/${urlUserId}`}
              className="bg-[#dcfc84] text-[#1c1c1c] px-8 py-4 rounded-lg text-lg font-medium hover:scale-105 transition-all duration-300 inline-block"
            >
              Back to Projects
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1c1c1c] text-white">
      <Header />

      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          

                     <div className="flex items-center mb-8">
             <a
               href={`/projects/${urlUserId}/${urlProjectId}`}
               className="p-2 text-white/70 hover:text-white hover:bg-[#bc6cd3]/10 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
               </svg>
               Back to project
             </a>
           </div>

           
           {/* Specific Requirements Box */}
           <div className="bg-[#1c1c1c] border border-[#bc6cd3]/20 rounded-lg p-4 mb-6">
             <div className="flex items-start gap-3">
               <svg className="w-5 h-5 text-[#dcfc84] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
               </svg>
               <div>
                 <h3 className="text-[#dcfc84] font-medium mb-2">⚠️ Critical Requirements - Must Complete</h3>
                 <ul className="text-white text-sm space-y-1">
                   <li className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-[#dcfc84] rounded-full"></span>
                     <strong>Step 1:</strong> Create exactly <strong>2 labels minimum</strong> (e.g., &ldquo;happy&rdquo;, &ldquo;sad&rdquo;)
                   </li>
                   <li className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-[#dcfc84] rounded-full"></span>
                     <strong>Step 2:</strong> Add <strong>at least 5 examples</strong> to each label
                   </li>
                   <li className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-[#dcfc84] rounded-full"></span>
                     <strong>Step 3:</strong> Examples can be text or uploaded from .txt files
                   </li>
                   <li className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-[#dcfc84] rounded-full"></span>
                     <strong>Step 4:</strong> Only then can you proceed to train your model
                   </li>
                 </ul>
               </div>
             </div>
           </div>

           <div className="text-center mb-8">
                               <h1 className="text-3xl md:text-4xl font-bold mb-3">
                  <span className="text-white">Recognising </span>
                  <span className="text-[#dcfc84]">text</span>
                  {labels.length > 0 && (
                    <>
                      <span className="text-white"> as </span>
                      <span className="text-[#dcfc84]">
                       {(() => {
                         if (labels.length === 1) return labels[0].name;
                         
                         // Get unique label names
                         const uniqueNames = [...new Set(labels.map(label => label.name))];
                         
                         if (labels.length === 2) {
                           if (uniqueNames.length === 1) {
                             return uniqueNames[0];
                           }
                           return `${uniqueNames[0]} or ${uniqueNames[1]}`;
                         }
                         
                         if (uniqueNames.length === 1) {
                           return uniqueNames[0];
                         } else if (uniqueNames.length === 2) {
                           return `${uniqueNames[0]} or ${uniqueNames[1]}`;
                         } else {
                           return `${uniqueNames[0]} or ${uniqueNames[1]} and ${uniqueNames.length - 2} others`;
                         }
                       })()}
                     </span>
                   </>
                 )}
               </h1>
             </div>

            {/* Add New Label Button and Submit Pending - Always on the Right */}
              <div className="flex justify-end items-center gap-4 mb-6">
                                 {labels.length === 0 && (
                   <div className="bg-[#1c1c1c] border border-[#bc6cd3]/20 rounded-lg p-4 mr-4 max-w-md">
                     <p className="text-white text-sm text-center">
                       Click on the &lsquo;plus&rsquo; button on the right to add your first bucket.→
                     </p>
                   </div>
                 )}
                                                  {/* Submit Pending Examples Button */}
                 {Object.values(pendingExamples).some(examples => examples.length > 0) && (
                   <button
                     onClick={submitAllPendingExamples}
                     disabled={isSubmittingToAPI}
                     className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-all duration-300 inline-flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                     </svg>
                     Submit Remaining ({Object.values(pendingExamples).reduce((sum, examples) => sum + examples.length, 0)})
                   </button>
                 )}

                 <button
                  onClick={() => setShowAddLabelModal(true)}
                  className="bg-[#dcfc84] hover:bg-[#dcfc84]/90 text-[#1c1c1c] px-4 py-4 rounded-lg transition-all duration-300 inline-flex items-center gap-2 text-sm font-medium"
                >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                 </svg>
                 Add new label
               </button>
              </div>

                                               {labels.length > 0 ? (
                      <div className={`grid gap-4 ${
                        labels.length === 1 ? 'grid-cols-1 max-w-2xl mx-auto' :
                        labels.length === 2 ? 'grid-cols-2 max-w-4xl mx-auto' :
                        'grid-cols-5 max-w-7xl mx-auto'
                      }`}>
                {labels.map((label) => (
                                                     <div key={label.id} className={`bg-[#1c1c1c] border-2 border-[#bc6cd3]/20 rounded-lg overflow-hidden relative ${
                             labels.length === 1 ? 'h-[600px]' :
                             labels.length === 2 ? 'h-[500px]' :
                             labels.length === 3 ? 'h-[400px]' :
                             labels.length === 4 ? 'h-[300px]' :
                             'h-[250px]'
                           }`}>
                   <div className="bg-[#bc6cd3]/20 px-3 py-2 flex justify-between items-center">
                     <h3 className="text-white font-semibold text-base">{label.name}</h3>
                     <button
                       onClick={() => handleDeleteLabel(label.id)}
                       className="text-red-500 hover:text-red-700 transition-all duration-300"
                       title="Delete label"
                     >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                       </svg>
                     </button>
                   </div>

                                         <div className="p-4 bg-[#1c1c1c] text-white flex flex-col h-full">
                      {label.examples.length === 0 ? (
                        // When no examples, show buttons at the top
                        <div className="space-y-2">
                          <button
                            onClick={() => openAddExampleModal(label.id)}
                            className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-[#bc6cd3]/40 text-[#dcfc84] hover:border-[#bc6cd3]/60 hover:text-[#dcfc84]/80 transition-all duration-300 rounded text-xs font-medium"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add example
                          </button>

                          <label className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-[#bc6cd3]/40 text-[#dcfc84] hover:border-[#bc6cd3]/60 hover:text-[#dcfc84]/80 transition-all duration-300 rounded text-xs font-medium cursor-pointer">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                            </svg>
                            Add file
                            <input
                              type="file"
                              accept=".txt,.csv"
                              onChange={(e) => handleFileUpload(e, label.id)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      ) : (
                        // When examples exist, show scrollable content with buttons at bottom
                        <>
                                                     <div className="h-40 overflow-y-auto space-y-2 mb-1 pr-1">
                       {label.examples.map((example) => (
                         <div
                           key={example.id}
                                className="bg-[#bc6cd3]/10 px-2 py-1 rounded text-xs flex justify-between items-center group hover:bg-[#bc6cd3]/20 transition-all duration-200"
                         >
                           <span className="flex-1">{example.text}</span>
                           <button
                             onClick={() => handleDeleteExample(label.id, example.id)}
                             className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-all duration-300 ml-2"
                             title="Delete example"
                           >
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                             </svg>
                           </button>
                         </div>
                       ))}
                     </div>

                          

                          <div className="space-y-2 flex-shrink-0">
                     <button
                       onClick={() => openAddExampleModal(label.id)}
                              className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-[#bc6cd3]/40 text-[#dcfc84] hover:border-[#bc6cd3]/60 hover:text-[#dcfc84]/80 transition-all duration-300 rounded text-xs font-medium"
                     >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                       </svg>
                       Add example
                     </button>

                            <label className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-[#bc6cd3]/40 text-[#dcfc84] hover:border-[#bc6cd3]/60 hover:text-[#dcfc84]/80 transition-all duration-300 rounded text-xs font-medium cursor-pointer">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                           </svg>
                              Add file
                              <input
                                type="file"
                                accept=".txt,.csv"
                                onChange={(e) => handleFileUpload(e, label.id)}
                                className="hidden"
                              />
                            </label>
                       </div>

                          

                     {label.examples.length > 0 && (
                             <div className="absolute bottom-2 right-2 flex gap-2">
                               <span className="bg-[#dcfc84] text-[#1c1c1c] text-xs px-2 py-1 rounded-full font-medium">
                           {label.examples.length}
                         </span>
                         {(pendingExamples[label.id]?.length || 0) > 0 && (
                           <span className="bg-yellow-500 text-[#1c1c1c] text-xs px-2 py-1 rounded-full font-medium">
                             {pendingExamples[label.id]?.length} pending
                           </span>
                         )}
                       </div>
                           )}
                         </>
                     )}
                   </div>
                 </div>
               ))}
             </div>
                        ) : null}
        </div>
      </main>

      {showAddLabelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c1c1c] border border-[#bc6cd3]/20 rounded-lg max-w-md w-full">
            <div className="bg-[#bc6cd3]/20 text-white px-6 py-4 rounded-t-lg">
              <h2 className="text-xl font-semibold">Add new label</h2>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-medium text-[#dcfc84] mb-2">
                Enter new label to recognise *
              </label>
              <input
                type="text"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newLabelName.trim()) {
                    handleAddLabel();
                  }
                }}
                placeholder="label"
                className="w-full px-3 py-2 border border-[#bc6cd3]/40 rounded text-white bg-[#1c1c1c] focus:outline-none focus:border-[#dcfc84]"
                maxLength={30}
                autoFocus
              />
              <div className="text-right text-xs text-white/60 mt-1">
                {newLabelName.length} / 30
              </div>
            </div>
            
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button
                onClick={() => {
                  setShowAddLabelModal(false);
                  setNewLabelName('');
                }}
                className="px-4 py-2 text-white/70 hover:text-white transition-all duration-300"
              >
                CANCEL
              </button>
              <button
                onClick={handleAddLabel}
                disabled={!newLabelName.trim() || isSubmittingToAPI}
                className="px-4 py-2 bg-[#dcfc84] text-[#1c1c1c] rounded hover:bg-[#dcfc84]/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmittingToAPI ? 'ADDING...' : 'ADD'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddExampleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c1c1c] border border-[#bc6cd3]/20 rounded-lg max-w-md w-full">
            <div className="bg-[#bc6cd3]/20 text-white px-6 py-4 rounded-t-lg">
              <h2 className="text-xl font-semibold">Add example</h2>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-medium text-[#dcfc84] mb-2">
                Enter an example of &lsquo;{labels.find(l => l.id === selectedLabelId)?.name}&rsquo; *
              </label>
              <textarea
                value={newExampleText}
                onChange={(e) => setNewExampleText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && newExampleText.trim()) {
                    e.preventDefault();
                    handleAddExample();
                  }
                }}
                className="w-full px-3 py-2 border border-[#bc6cd3]/40 rounded text-white bg-[#1c1c1c] focus:outline-none focus:border-[#dcfc84] h-24 resize-none"
                maxLength={1000}
                autoFocus
              />
              <div className="text-right text-xs text-white/60 mt-1">
                {newExampleText.length} / 1000
              </div>
            </div>
            
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button
                onClick={() => {
                  setShowAddExampleModal(false);
                  setNewExampleText('');
                  setSelectedLabelId('');
                }}
                className="px-4 py-2 text-white/70 hover:text-white transition-all duration-300"
              >
                CANCEL
              </button>
              <button
                onClick={handleAddExample}
                disabled={!newExampleText.trim() || isSubmittingToAPI}
                className="px-4 py-2 bg-[#dcfc84] text-[#1c1c1c] rounded hover:bg-[#dcfc84]/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmittingToAPI ? 'ADDING...' : 'ADD'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
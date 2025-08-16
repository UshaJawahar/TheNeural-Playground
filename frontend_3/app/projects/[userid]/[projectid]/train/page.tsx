'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '../../../../../components/Header';

interface UserSession {
  userId: string;
  createdAt: number;
  expiresAt: number;
}

interface Project {
  id: string;
  name: string;
  type: string;
  createdAt: string;
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
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidSession, setIsValidSession] = useState(false);

  const params = useParams();
  const urlUserId = params?.userid as string;
  const urlProjectId = params?.projectid as string;

  useEffect(() => {
    validateUserSession();
  }, [urlUserId, urlProjectId]);

  const validateUserSession = () => {
    if (!urlUserId || !urlProjectId) {
      setIsLoading(false);
      return;
    }

    try {
      const sessionData = localStorage.getItem('neural_playground_session');
      if (sessionData) {
        const session: UserSession = JSON.parse(sessionData);
        const now = Date.now();
        
        if (now < session.expiresAt && session.userId === urlUserId) {
          setUserSession(session);
          setIsValidSession(true);
          loadProjectAndLabels(session.userId, urlProjectId);
        } else if (session.userId !== urlUserId) {
          window.location.href = `/projects/${session.userId}`;
          return;
        } else {
          localStorage.removeItem('neural_playground_session');
          window.location.href = '/projects';
          return;
        }
      } else {
        window.location.href = '/projects';
        return;
      }
    } catch (error) {
      console.error('Error validating session:', error);
      localStorage.removeItem('neural_playground_session');
      window.location.href = '/projects';
      return;
    }
    setIsLoading(false);
  };

  const loadProjectAndLabels = (userId: string, projectId: string) => {
    try {
      const projectsKey = `neural_playground_projects_${userId}`;
      const savedProjects = localStorage.getItem(projectsKey);
      if (savedProjects) {
        const projects: Project[] = JSON.parse(savedProjects);
        const project = projects.find(p => p.id === projectId);
        if (project) {
          setSelectedProject(project);
        } else {
          window.location.href = `/projects/${userId}`;
          return;
        }
      }

      const labelsKey = `neural_playground_labels_${userId}_${projectId}`;
      const savedLabels = localStorage.getItem(labelsKey);
      if (savedLabels) {
        setLabels(JSON.parse(savedLabels));
      }
    } catch (error) {
      console.error('Error loading project and labels:', error);
    }
  };

  const saveLabels = (userId: string, projectId: string, labelsData: Label[]) => {
    try {
      const labelsKey = `neural_playground_labels_${userId}_${projectId}`;
      localStorage.setItem(labelsKey, JSON.stringify(labelsData));
    } catch (error) {
      console.error('Error saving labels:', error);
    }
  };

  const handleAddLabel = () => {
    if (newLabelName.trim() && userSession && selectedProject) {
      const newLabel: Label = {
        id: `label-${Date.now()}`,
        name: newLabelName.trim(),
        examples: [],
        createdAt: new Date().toLocaleDateString()
      };
      
      const updatedLabels = [...labels, newLabel];
      setLabels(updatedLabels);
      saveLabels(userSession.userId, selectedProject.id, updatedLabels);
      
      setNewLabelName('');
      setShowAddLabelModal(false);
    }
  };

  const handleAddExample = () => {
    if (newExampleText.trim() && selectedLabelId && userSession && selectedProject) {
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
      saveLabels(userSession.userId, selectedProject.id, updatedLabels);
      
      setNewExampleText('');
      setSelectedLabelId('');
      setShowAddExampleModal(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, labelId: string) => {
    const file = event.target.files?.[0];
    if (!file || !userSession || !selectedProject) return;

    const reader = new FileReader();
    reader.onload = (e) => {
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
        saveLabels(userSession.userId, selectedProject.id, updatedLabels);
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  const handleDeleteLabel = (labelId: string) => {
    if (userSession && selectedProject) {
      const updatedLabels = labels.filter(label => label.id !== labelId);
      setLabels(updatedLabels);
      saveLabels(userSession.userId, selectedProject.id, updatedLabels);
    }
  };

  const handleDeleteExample = (labelId: string, exampleId: string) => {
    if (userSession && selectedProject) {
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
      saveLabels(userSession.userId, selectedProject.id, updatedLabels);
    }
  };

  const openAddExampleModal = (labelId: string) => {
    setSelectedLabelId(labelId);
    setShowAddExampleModal(true);
  };

  const handleLanguageChange = (language: string) => {
    console.log('Language changed to:', language);
  };

  const handleLoginClick = () => {
    console.log('Login clicked');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#010101] to-[#0a0a0a] text-white">
        <Header 
          onLanguageChange={handleLanguageChange}
          onLoginClick={handleLoginClick}
        />
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
      <div className="min-h-screen bg-gradient-to-b from-[#010101] to-[#0a0a0a] text-white">
        <Header 
          onLanguageChange={handleLanguageChange}
          onLoginClick={handleLoginClick}
        />
        <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Invalid Session or Project
            </h1>
            <p className="text-lg text-[#d6d9d8] mb-8">
              Please return to your projects and try again.
            </p>
            <a 
              href={`/projects/${urlUserId}`}
              className="bg-gradient-to-r from-[#b90abd] to-[#5332ff] text-white px-8 py-4 rounded-lg text-lg font-medium hover:scale-105 hover:shadow-lg transition-all duration-300 inline-block"
            >
              Back to Projects
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#010101] to-[#0a0a0a] text-white">
      <Header 
        onLanguageChange={handleLanguageChange}
        onLoginClick={handleLoginClick}
      />

      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          

                     <div className="flex items-center mb-8">
             <a
               href={`/projects/${urlUserId}/${selectedProject.id}`}
               className="text-blue-400 hover:text-blue-300 transition-all duration-300 flex items-center gap-2 text-sm"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
               </svg>
               Back to project
             </a>
           </div>

           
           {/* Specific Requirements Box */}
           <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
             <div className="flex items-start gap-3">
               <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
               </svg>
               <div>
                 <h3 className="text-yellow-800 font-medium mb-2">⚠️ Critical Requirements - Must Complete</h3>
                 <ul className="text-yellow-700 text-sm space-y-1">
                   <li className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></span>
                     <strong>Step 1:</strong> Create exactly <strong>2 labels minimum</strong> (e.g., "happy", "sad")
                   </li>
                   <li className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></span>
                     <strong>Step 2:</strong> Add <strong>at least 5 examples</strong> to each label
                   </li>
                   <li className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></span>
                     <strong>Step 3:</strong> Examples can be text or uploaded from .txt files
                   </li>
                   <li className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full"></span>
                     <strong>Step 4:</strong> Only then can you proceed to train your model
                   </li>
                 </ul>
               </div>
             </div>
           </div>

           <div className="text-center mb-8">
               <h1 className="text-3xl md:text-4xl font-bold mb-3">
                 <span className="text-[#d6d9d8]">Recognising </span>
                 <span className="text-blue-400">text</span>
                 {labels.length > 0 && (
                   <>
                     <span className="text-[#d6d9d8]"> as </span>
                     <span className="text-green-400">
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

            {/* Add New Label Button - Always on the Right */}
              <div className="flex justify-end mb-6">
                {labels.length === 0 && (
                  <div className="bg-blue-200 rounded-lg p-4 mr-4 max-w-md">
                    <p className="text-blue-800 text-sm text-center">
                      Click on the 'plus' button on the right to add your first bucket.→
                    </p>
                  </div>
                )}
                <button
                  onClick={() => setShowAddLabelModal(true)}
                  className="bg-white/10 border border-white/20 text-white px-4 py-4 rounded-lg hover:bg-white/20 transition-all duration-300 inline-flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add new label
                </button>
              </div>

                       {labels.length > 0 ? (
                     <div className="grid grid-cols-5 gap-4">
               {labels.map((label) => (
                         <div key={label.id} className={`bg-[#f5f5f5] border-2 border-gray-300 rounded-lg overflow-hidden relative ${
                           label.examples.length === 0 ? 'h-[320px]' : 'h-[320px]'
                         }`}>
                   <div className="bg-gray-300 px-3 py-2 flex justify-between items-center">
                     <h3 className="text-black font-semibold text-base">{label.name}</h3>
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

                    <div className="p-4 bg-white text-black flex flex-col h-full">
                      {label.examples.length === 0 ? (
                        // When no examples, show buttons at the top
                        <div className="space-y-2">
                          <button
                            onClick={() => openAddExampleModal(label.id)}
                            className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-all duration-300 rounded text-xs font-medium"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add example
                          </button>

                          <label className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-all duration-300 rounded text-xs font-medium cursor-pointer">
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
                                className="bg-gray-100 px-2 py-1 rounded text-xs flex justify-between items-center group hover:bg-gray-200 transition-all duration-200"
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
                              className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-all duration-300 rounded text-xs font-medium"
                     >
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                       </svg>
                       Add example
                     </button>

                            <label className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-all duration-300 rounded text-xs font-medium cursor-pointer">
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
                             <div className="absolute bottom-2 right-2">
                               <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                           {label.examples.length}
                         </span>
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
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
              <h2 className="text-xl font-semibold">Add new label</h2>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-medium text-blue-600 mb-2">
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
                className="w-full px-3 py-2 border border-gray-300 rounded text-black focus:outline-none focus:border-blue-600"
                maxLength={30}
                autoFocus
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {newLabelName.length} / 30
              </div>
            </div>
            
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button
                onClick={() => {
                  setShowAddLabelModal(false);
                  setNewLabelName('');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-all duration-300"
              >
                CANCEL
              </button>
              <button
                onClick={handleAddLabel}
                disabled={!newLabelName.trim()}
                className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ADD
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddExampleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
              <h2 className="text-xl font-semibold">Add example</h2>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-medium text-blue-600 mb-2">
                Enter an example of '{labels.find(l => l.id === selectedLabelId)?.name}' *
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
                className="w-full px-3 py-2 border border-gray-300 rounded text-black focus:outline-none focus:border-blue-600 h-24 resize-none"
                maxLength={1000}
                autoFocus
              />
              <div className="text-right text-xs text-gray-500 mt-1">
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
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-all duration-300"
              >
                CANCEL
              </button>
              <button
                onClick={handleAddExample}
                disabled={!newExampleText.trim()}
                className="px-4 py-2 bg-gray-300 text-gray-600 rounded hover:bg-gray-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ADD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
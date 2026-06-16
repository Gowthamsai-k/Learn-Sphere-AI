"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen, Clock, Award, Plus, Search, ChevronRight, X, ArrowLeft,
  HelpCircle, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Flame, Sliders, LogOut,
  MessageSquare, Send, User, Settings, Mail, Shield, FileText, TrendingUp, Calendar
} from 'lucide-react';

interface Document {
  id: string;
  title: string;
  created_at: string;
}

interface ProgressMetrics {
  readingProgress: string;
  quizzesTaken: number;
  averageQuizGrade: string;
  readinessIndex: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

function RadarChart({ topics }: { topics: { name: string; progress: number }[] }) {
  if (!topics || topics.length < 3) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-slate-400 font-semibold border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
        <span className="text-xl mb-1">📊</span>
        Need at least 3 topics to render radar analysis.
      </div>
    );
  }

  const size = 180;
  const center = size / 2;
  const radius = center - 25;
  const N = topics.length;

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const gridPolygons = gridLevels.map(level => {
    const points = [];
    for (let i = 0; i < N; i++) {
      const angle = (2 * Math.PI * i) / N;
      const r = radius * level;
      const x = center + r * Math.sin(angle);
      const y = center - r * Math.cos(angle);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  });

  const progressPoints = topics.map((topic, i) => {
    const angle = (2 * Math.PI * i) / N;
    const r = radius * (topic.progress / 100);
    const x = center + r * Math.sin(angle);
    const y = center - r * Math.cos(angle);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-center justify-center py-2">
      <svg width={size} height={size} className="overflow-visible">
        {/* Grids */}
        {gridPolygons.map((points, idx) => (
          <polygon
            key={idx}
            points={points}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="1"
            strokeDasharray={idx < 3 ? "2,2" : "none"}
          />
        ))}

        {/* Axes and Labels */}
        {topics.map((topic, i) => {
          const angle = (2 * Math.PI * i) / N;
          const outerX = center + radius * Math.sin(angle);
          const outerY = center - radius * Math.cos(angle);

          const labelDist = radius + 15;
          const labelX = center + labelDist * Math.sin(angle);
          const labelY = center - labelDist * Math.cos(angle);

          let textAnchor: "start" | "end" | "middle" = "middle";
          if (Math.sin(angle) > 0.1) textAnchor = "start";
          else if (Math.sin(angle) < -0.1) textAnchor = "end";

          return (
            <g key={i}>
              <line
                x1={center}
                y1={center}
                x2={outerX}
                y2={outerY}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text
                x={labelX}
                y={labelY + 3}
                textAnchor={textAnchor}
                className="text-[8px] font-bold fill-slate-400"
              >
                {topic.name.length > 8 ? topic.name.slice(0, 6) + '..' : topic.name}
              </text>
            </g>
          );
        })}

        {/* Filled Area */}
        <polygon
          points={progressPoints}
          fill="rgba(79, 70, 229, 0.15)"
          stroke="#4f46e5"
          strokeWidth="1.5"
        />

        {/* Dots */}
        {topics.map((topic, i) => {
          const angle = (2 * Math.PI * i) / N;
          const r = radius * (topic.progress / 100);
          const x = center + r * Math.sin(angle);
          const y = center - r * Math.cos(angle);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              className="fill-indigo-600 stroke-white stroke-2"
            />
          );
        })}
      </svg>
    </div>
  );
}

function parseInlineMarkdown(text: string, isUser = false): React.ReactNode {
  const parts: any[] = [];
  let index = 0;
  const regex = /(\*\*|__)(.*?)\1|(\*|_)(.*?)\3/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > index) {
      parts.push(text.substring(index, match.index));
    }
    if (match[1]) {
      parts.push(<strong key={match.index} className={`font-extrabold ${isUser ? 'text-white' : 'text-slate-900'}`}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={match.index} className={`italic ${isUser ? 'text-indigo-100' : 'text-slate-800'}`}>{match[4]}</em>);
    }
    index = regex.lastIndex;
  }
  if (index < text.length) {
    parts.push(text.substring(index));
  }

  return parts.flatMap((part, idx) => {
    if (typeof part !== 'string') return [part];
    
    const subparts = part.split(/(\[Source \d+\])/g);
    return subparts.map((sub, sIdx) => {
      const sourceMatch = sub.match(/\[Source (\d+)\]/);
      if (sourceMatch) {
        return (
          <span
            key={`${idx}-${sIdx}`}
            className="inline-block mx-0.5 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 font-extrabold text-[10px] rounded border border-indigo-100 animate-pulse-subtle"
            title={`Referenced Section ${sourceMatch[1]}`}
          >
            Source {sourceMatch[1]}
          </span>
        );
      }
      return sub;
    });
  });
}

function parseMarkdown(text: string, isUser = false): React.ReactNode {
  if (!text) return null;
  const blocks = text.split(/\n\n+/);
  
  return blocks.map((block, blockIdx) => {
    const trimmed = block.trim();
    if (!trimmed) return null;
    
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const parsedContent = parseInlineMarkdown(content, isUser);
      
      if (level === 1) return <h1 key={blockIdx} className={`text-2xl font-extrabold mt-6 mb-3 ${isUser ? 'text-white' : 'text-slate-900'}`}>{parsedContent}</h1>;
      if (level === 2) return <h2 key={blockIdx} className={`text-xl font-bold mt-5 mb-2 ${isUser ? 'text-white' : 'text-slate-800'}`}>{parsedContent}</h2>;
      if (level === 3) return <h3 key={blockIdx} className={`text-lg font-bold mt-4 mb-2 ${isUser ? 'text-white' : 'text-slate-800'}`}>{parsedContent}</h3>;
      return <h4 key={blockIdx} className={`text-base font-bold mt-3 mb-1 ${isUser ? 'text-white' : 'text-slate-800'}`}>{parsedContent}</h4>;
    }
    
    const lines = trimmed.split('\n');
    const isList = lines.every(line => /^\s*[-*+•]\s+/.test(line));
    if (isList) {
      return (
        <ul key={blockIdx} className="list-disc pl-5 space-y-1 mb-4">
          {lines.map((line, lineIdx) => {
            const itemText = line.replace(/^\s*[-*+•]\s+/, '');
            return <li key={lineIdx} className={`text-sm ${isUser ? 'text-white/95' : 'text-slate-700'}`}>{parseInlineMarkdown(itemText, isUser)}</li>;
          })}
        </ul>
      );
    }

    const isNumberedList = lines.every(line => /^\s*\d+\.\s+/.test(line));
    if (isNumberedList) {
      return (
        <ol key={blockIdx} className="list-decimal pl-5 space-y-1 mb-4">
          {lines.map((line, lineIdx) => {
            const itemText = line.replace(/^\s*\d+\.\s+/, '');
            return <li key={lineIdx} className={`text-sm ${isUser ? 'text-white/95' : 'text-slate-700'}`}>{parseInlineMarkdown(itemText, isUser)}</li>;
          })}
        </ol>
      );
    }
    
    const paragraphLines = trimmed.split('\n');
    return (
      <div key={blockIdx} className={`text-sm leading-relaxed mb-4 ${isUser ? 'text-white/95' : 'text-slate-700'}`}>
        {paragraphLines.map((line, lineIdx) => (
          <span key={lineIdx}>
            {parseInlineMarkdown(line, isUser)}
            {lineIdx < paragraphLines.length - 1 && <br />}
          </span>
        ))}
      </div>
    );
  });
}

export default function LearnSphereApp() {
  const router = useRouter();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Navigation state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'quiz' | 'study' | 'account'>('dashboard');

  // Dashboard state
  const [documents, setDocuments] = useState<Document[]>([]);
  const [overallProgress, setOverallProgress] = useState<{
    totalStudyTime: string;
    masteryLevel: string;
    masteryLevelCode: string;
    masteryPercentage: number;
    quizzesTaken: number;
    averageQuizGrade: string;
    streak: number;
    xp: number;
    topics: { name: string; progress: number }[];
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Ingest Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'text' | 'pdf'>('pdf');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);

  // Quiz state
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [selectedDocTitle, setSelectedDocTitle] = useState<string>('');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [certaintyIndex, setCertaintyIndex] = useState(75);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [quizError, setQuizError] = useState('');

  // Study Center state
  const [studySubTab, setStudySubTab] = useState<'summary' | 'chat' | 'search'>('summary');
  const [summaryText, setSummaryText] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [sendingChat, setSendingChat] = useState(false);
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [docSearchResults, setDocSearchResults] = useState<any[]>([]);
  const [searchingDoc, setSearchingDoc] = useState(false);
  const [hasRestoredStudy, setHasRestoredStudy] = useState(false);

  // Check Auth and Load Dashboard Data
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setCurrentUser(data.user);
            fetchDocuments();
            fetchProgress(data.user.id);
          } else {
            router.push('/login');
          }
        } else {
          router.push('/login');
        }
      } catch (err) {
        router.push('/login');
      } finally {
        setLoadingAuth(false);
      }
    }
    checkAuth();
  }, [router]);

  // Load state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedActiveTab = localStorage.getItem('activeTab') as any;
      const savedDocId = localStorage.getItem('selectedDocId');
      const savedDocTitle = localStorage.getItem('selectedDocTitle');
      const savedStudySubTab = localStorage.getItem('studySubTab') as any;

      if (savedActiveTab) setActiveTab(savedActiveTab);
      if (savedDocId) setSelectedDocId(savedDocId);
      if (savedDocTitle) setSelectedDocTitle(savedDocTitle);
      if (savedStudySubTab) setStudySubTab(savedStudySubTab);

      if (savedActiveTab === 'study' && savedDocId) {
        setHasRestoredStudy(true);
      }
    }
  }, []);

  // Save state to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeTab', activeTab);
      localStorage.setItem('selectedDocId', selectedDocId);
      localStorage.setItem('selectedDocTitle', selectedDocTitle);
      localStorage.setItem('studySubTab', studySubTab);
    }
  }, [activeTab, selectedDocId, selectedDocTitle, studySubTab]);

  useEffect(() => {
    if (hasRestoredStudy && selectedDocId && activeTab === 'study') {
      setHasRestoredStudy(false);
      setSummaryText('');
      setChatMessages([]);
      setDocSearchQuery('');
      setDocSearchResults([]);
      startStudy(selectedDocId, selectedDocTitle);
    }
  }, [hasRestoredStudy, selectedDocId, activeTab, selectedDocTitle]);

  const fetchDocuments = async () => {
    try {
      setLoadingDocs(true);
      const res = await fetch('/api/documents', { credentials: 'include' });
      console.log('[Client] GET /api/documents status:', res.status);
      const data = await res.json();
      console.log('[Client] /api/documents response:', data);
      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const fetchProgress = async (userId: string) => {
    try {
      const res = await fetch(`/api/progress?userId=${userId}`);
      const data = await res.json();
      if (data.overall) {
        setOverallProgress(data.overall);
      }
    } catch (err) {
      console.error("Failed to load progress metrics", err);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('activeTab');
          localStorage.removeItem('selectedDocId');
          localStorage.removeItem('selectedDocTitle');
          localStorage.removeItem('studySubTab');
          localStorage.removeItem('summaryText');
          localStorage.removeItem('chatMessages');
        }
        router.push('/login');
        router.refresh();
      }
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  // Start Quiz Handler
  const startQuiz = async (docId: string, docTitle: string) => {
    if (!currentUser) return;
    setSelectedDocId(docId);
    setSelectedDocTitle(docTitle);
    setActiveTab('quiz');
    setLoadingQuiz(true);
    setQuizQuestions([]);
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setIsConfirmed(false);
    setScore(0);
    setQuizError('');

    try {
      const res = await fetch('/api/quiz/generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId, userId: currentUser.id })
      });
      const data = await res.json();
      if (data.error) {
        setQuizError(data.error);
      } else if (Array.isArray(data)) {
        setQuizQuestions(data);
      } else {
        setQuizError("Invalid quiz format returned by model.");
      }
    } catch (err: any) {
      setQuizError(err.message || "Failed to load quiz.");
    } finally {
      setLoadingQuiz(false);
    }
  };

  // Start Study Center Handler
  const startStudy = async (docId: string, docTitle: string) => {
    if (!currentUser) return;
    if (!docId) {
      alert('Cannot start Study Center without a valid document.');
      return;
    }

    setSelectedDocId(docId);
    setSelectedDocTitle(docTitle);
    setActiveTab('study');
    setStudySubTab('summary');
    setSummaryText('');
    setChatMessages([]);
    setDocSearchQuery('');
    setDocSearchResults([]);

    setLoadingSummary(true);
    try {
      const res = await fetch('/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentId: docId }),
          credentials: 'include'
        });
      const data = await res.json();
      console.log('[Client] /api/summarize response status:', res.status, 'body:', data);
      if (data.summary) {
        setSummaryText(data.summary);
      } else if (data.error) {
        setSummaryText(data.error);
      } else {
        setSummaryText("Unable to generate summary for this document.");
      }
    } catch (err: any) {
      console.error("Failed to load summary", err);
      setSummaryText(err?.message || "Error generating summary.");
    } finally {
      setLoadingSummary(false);
    }
  };

  // Chatbot Doubt Explainer handler
  const handleSendChatMessage = async () => {
    if (!selectedDocId) {
      alert('Please select a document before asking a question.');
      return;
    }
    if (!chatInput.trim() || sendingChat) return;
    const userMsg = chatInput.trim();
    setChatInput('');

    const newMessages = [...chatMessages, { role: 'user' as const, content: userMsg }];
    setChatMessages(newMessages);
    setSendingChat(true);

    try {
      console.log('[Client] POST /api/chat payload docId:', selectedDocId);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: selectedDocId,
          messages: newMessages
        }),
        credentials: 'include'
      });

      if (!res.body) throw new Error("No body response");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantMsg = '';

      setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        assistantMsg += chunk;
        setChatMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: assistantMsg };
          return updated;
        });
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: err?.message || "An error occurred while getting response." }]);
    } finally {
      setSendingChat(false);
    }
  };

  // Semantic Search within Document handler
  const handleDocSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedDocId) {
      alert('Please select a document before searching.');
      return;
    }
    if (!docSearchQuery.trim() || searchingDoc) return;
    setSearchingDoc(true);

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          question: docSearchQuery,
          documentId: selectedDocId
        })
      });
      const data = await res.json();
      if (data.matches) {
        setDocSearchResults(data.matches);
      } else if (data.error) {
        console.error('Search error response:', data.error);
        setDocSearchResults([]);
      } else {
        setDocSearchResults([]);
      }
    } catch (err) {
      console.error("Search error:", err);
      setDocSearchResults([]);
    } finally {
      setSearchingDoc(false);
    }
  };

  // Handle Document Ingestion
  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsIngesting(true);

    try {
      let res;
      if (uploadType === 'pdf') {
        if (!selectedFile) {
          alert("Please select a PDF file first.");
          setIsIngesting(false);
          return;
        }
        const formData = new FormData();
        formData.append('file', selectedFile);
        res = await fetch('/api/ingest', {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
      } else {
        if (!newDocTitle || !newDocContent) {
          alert("Please fill in the title and text content.");
          setIsIngesting(false);
          return;
        }
        res = await fetch('/api/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newDocTitle, text: newDocContent }),
          credentials: 'include'
        });
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setIsModalOpen(false);
        setNewDocTitle('');
        setNewDocContent('');
        setSelectedFile(null);
        fetchDocuments();
        fetchProgress(currentUser.id);
      } else {
        const message = data.error || "Failed to ingest document.";
        alert(message);
        console.error('Ingest error:', message, data);
      }
    } catch (err: any) {
      console.error("Failed to ingest document", err);
      alert(err.message || "An error occurred during ingestion.");
    } finally {
      setIsIngesting(false);
    }
  };

  // Confirm Option Choice
  const handleConfirmChoice = () => {
    if (selectedOption === null || isConfirmed) return;
    setIsConfirmed(true);
    const currentQ = quizQuestions[currentQuestionIdx];
    const isCorrect = String.fromCharCode(65 + selectedOption) === currentQ.answer;

    if (isCorrect) {
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }
  };

  const handleNextQuestion = async () => {
    setSelectedOption(null);
    setIsConfirmed(false);
    if (currentQuestionIdx + 1 < quizQuestions.length) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      if (currentUser && selectedDocId) {
        try {
          await fetch('/api/quiz/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser.id,
              documentId: selectedDocId,
              score,
              totalQuestions: quizQuestions.length,
              correctStreak: streak
            })
          });
        } catch (err) {
          console.error("Failed to submit quiz attempt:", err);
        }
      }
      alert(`Quiz Finished! You scored ${score}/${quizQuestions.length}`);
      setActiveTab('dashboard');
      if (currentUser) fetchProgress(currentUser.id);
    }
  };

  // Helper to extract initials
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Filtering documents based on search query
  const filteredDocs = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render Spinner during Authentication Check
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">Checking credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
            L
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-900 to-indigo-900 bg-clip-text text-transparent">
              Learn-Sphere AI
            </h1>

          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-indigo-600'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              if (documents.length > 0 && !selectedDocId) {
                startStudy(documents[0].id, documents[0].title);
              } else if (selectedDocId) {
                setActiveTab('study');
              } else {
                setActiveTab('study');
              }
            }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${activeTab === 'study' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-indigo-600'}`}
          >
            Study Center
          </button>
          <button
            onClick={() => {
              if (documents.length > 0) {
                startQuiz(documents[0].id, documents[0].title);
              } else {
                setActiveTab('quiz');
              }
            }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${activeTab === 'quiz' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:text-indigo-600'}`}
          >
            Quiz Lab
          </button>
        </nav>

        {/* Search & Actions */}
        <div className="flex items-center gap-4">
          {currentUser && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('account')}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm border shadow-inner transition-all cursor-pointer hover:scale-105 ${activeTab === 'account' ? 'bg-indigo-600 text-white border-indigo-700 ring-2 ring-indigo-300' : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:border-indigo-400'}`}
                title="My Account"
              >
                {getInitials(currentUser.name)}
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">

        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && currentUser && (
          <div className="space-y-8 animate-fadeIn">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-900 to-indigo-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.2),transparent_70%)]"></div>
              <div className="relative z-10 space-y-2">
                <span className="text-xs bg-indigo-500/30 text-indigo-200 px-3 py-1 rounded-full font-semibold border border-indigo-500/20">Dashboard Analytics</span>
                <h2 className="text-3xl font-extrabold tracking-tight">Welcome back, {currentUser.name}</h2>
                <p className="text-indigo-100/80 text-sm">Ready to accelerate your learning journey today?</p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="relative z-10 px-6 py-3 bg-white text-indigo-950 rounded-2xl font-bold text-sm shadow-lg hover:shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 self-start md:self-auto"
              >
                <Plus className="w-4 h-4" />
                Upload New Resource
              </button>
            </div>


            {/* Stat Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Study Time Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-indigo-100 hover:shadow-md transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Total Study Time</p>
                    <h3 className="text-3xl font-extrabold text-slate-800">{overallProgress?.totalStudyTime || "0.0 hrs"}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-6 flex items-end gap-2 h-10">
                  <div className="w-full bg-emerald-100 rounded-t-md h-[40%]"></div>
                  <div className="w-full bg-emerald-200 rounded-t-md h-[60%]"></div>
                  <div className="w-full bg-emerald-100 rounded-t-md h-[30%]"></div>
                  <div className="w-full bg-emerald-300 rounded-t-md h-[80%]"></div>
                  <div className="w-full bg-emerald-500 rounded-t-md h-[100%]"></div>
                </div>
                <p className="text-xs text-emerald-600 font-semibold mt-4 flex items-center gap-1">
                  <span>Based on study logs</span>
                </p>
              </div>

              {/* Mastery Level Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-indigo-100 hover:shadow-md transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Mastery Level</p>
                    <h3 className="text-3xl font-extrabold text-slate-800">{overallProgress?.masteryLevel || "Novice"}</h3>

                  </div>
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle cx="32" cy="32" r="26" stroke="#f1f5f9" strokeWidth="5" fill="transparent" />
                      <circle cx="32" cy="32" r="26" stroke="#4f46e5" strokeWidth="5" fill="transparent"
                        strokeDasharray={163} strokeDashoffset={163 * (1 - (overallProgress?.masteryPercentage || 0) / 100)} strokeLinecap="round" />
                    </svg>
                    <span className="absolute text-xs font-bold text-indigo-950">{overallProgress?.masteryPercentage || 0}%</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-4">Calculated from reading and quiz accuracy weights.</p>
              </div>

              {/* Quizzes Completed Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-indigo-100 hover:shadow-md transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Quizzes Completed</p>
                    <h3 className="text-3xl font-extrabold text-slate-800">{overallProgress?.quizzesTaken || 0}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Award className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2.5 py-1 rounded-full border border-indigo-100">Scholar Scholar</span>
                  <span className="text-[10px] bg-violet-50 text-violet-600 font-bold px-2.5 py-1 rounded-full border border-violet-100">Academic Lab</span>
                </div>
                <p className="text-xs text-slate-500 mt-4">Current Grade average: <strong className="text-indigo-950">{overallProgress?.averageQuizGrade || "0%"}</strong></p>
              </div>
            </div>

            {/* Split Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Topics Mastery */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                  <h4 className="font-extrabold text-slate-900 text-base">Topics Mastery</h4>
                  <span className="text-xs text-slate-400">Adaptive stats</span>
                </div>

                {overallProgress?.topics && overallProgress.topics.length > 0 && (
                  <div className="border-b border-slate-50 pb-4">
                    <RadarChart topics={overallProgress.topics} />
                  </div>
                )}

                <div className="space-y-5">
                  {overallProgress?.topics && overallProgress.topics.length > 0 ? (
                    overallProgress.topics.map((topic, index) => {
                      const colors = ['bg-indigo-600', 'bg-purple-600', 'bg-emerald-600', 'bg-blue-600'];
                      const textColors = ['text-indigo-600', 'text-purple-600', 'text-emerald-600', 'text-blue-600'];
                      const colorClass = colors[index % colors.length];
                      const textColorClass = textColors[index % textColors.length];

                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                            <span className="line-clamp-1 pr-2">{topic.name}</span>
                            <span className={textColorClass}>{topic.progress}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`${colorClass} h-full rounded-full`} style={{ width: `${topic.progress}%` }}></div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400 font-semibold">
                      No study history yet. Start a quiz to begin tracking your mastery!
                    </div>
                  )}
                </div>

                <button className="w-full py-3 border border-slate-200 hover:border-indigo-600 hover:text-indigo-600 text-slate-600 text-xs font-bold rounded-xl transition-all">
                  View All Subjects
                </button>
              </div>

              {/* Right Column: Recent Documents */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-base">Recent Documents</h4>
                  <button className="text-xs text-indigo-600 font-bold hover:underline">See Library</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {loadingDocs ? (
                    <div className="col-span-2 py-12 flex items-center justify-center text-slate-400 gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Syncing files from Supabase...</span>
                    </div>
                  ) : filteredDocs.length === 0 ? (
                    <div className="col-span-2 py-12 text-center text-slate-400">
                      No documents found matching search criteria.
                    </div>
                  ) : (
                    filteredDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                            <BookOpen className="w-6 h-6" />
                          </div>
                          <div className="space-y-1">
                            <h5 className="font-extrabold text-slate-800 text-sm group-hover:text-indigo-600 transition-all line-clamp-1">
                              {doc.title}
                            </h5>
                            <p className="text-[10px] text-slate-400">
                              Updated {new Date(doc.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="mt-6 flex items-center gap-4">
                          <button
                            onClick={() => startStudy(doc.id, doc.title)}
                            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-all"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Study</span>
                          </button>
                          <span className="text-slate-200">|</span>
                          <button
                            onClick={() => startQuiz(doc.id, doc.title)}
                            className="flex items-center gap-1.5 text-xs font-bold text-purple-600 hover:text-purple-800 transition-all"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Quiz</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Upload Resource dashed card */}
                  <div
                    onClick={() => setIsModalOpen(true)}
                    className="border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-2 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/20 transition-all min-h-[140px]"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-600">Upload New Resource</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STUDY TAB */}
        {activeTab === 'study' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="p-2.5 rounded-xl bg-white border border-slate-100 hover:bg-slate-50 shadow-sm transition-all"
                >
                  <ArrowLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div>
                  <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-full border border-indigo-100">Study Center</span>
                  <h3 className="text-2xl font-extrabold text-slate-800 line-clamp-1 mt-1">{selectedDocTitle}</h3>
                </div>
              </div>
              <button
                onClick={() => startQuiz(selectedDocId, selectedDocTitle)}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Award className="w-4 h-4" />
                Take Adaptive Quiz
              </button>
            </div>

            {/* Sub-navigation Tabs */}
            <div className="flex border-b border-slate-200 gap-6">
              <button
                onClick={() => setStudySubTab('summary')}
                className={`pb-3 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${studySubTab === 'summary' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-indigo-600'}`}
              >
                <BookOpen className="w-4 h-4" />
                Executive Summary
              </button>
              <button
                onClick={() => setStudySubTab('chat')}
                className={`pb-3 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${studySubTab === 'chat' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-indigo-600'}`}
              >
                <MessageSquare className="w-4 h-4" />
                AI Explainer Chat
              </button>
              <button
                onClick={() => setStudySubTab('search')}
                className={`pb-3 font-semibold text-sm border-b-2 transition-all flex items-center gap-2 ${studySubTab === 'search' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-indigo-600'}`}
              >
                <Search className="w-4 h-4" />
                Semantic Search & Citations
              </button>
            </div>

            {/* Subtab Contents */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm min-h-[400px]">
              
              {/* SUMMARY SUBTAB */}
              {studySubTab === 'summary' && (
                <div className="space-y-6">
                  {loadingSummary ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                      <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                      <p className="font-semibold text-sm">Generating executive summaries...</p>
                    </div>
                  ) : (
                    <div className="prose prose-slate max-w-none">
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-6">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-2">
                          <Sparkles className="w-4 h-4" />
                          AI Summary & Insights
                        </div>
                        <div className="text-sm text-slate-700 leading-relaxed font-medium">
                          {summaryText ? parseMarkdown(summaryText) : "No summary available for this document."}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CHAT SUBTAB */}
              {studySubTab === 'chat' && (
                <div className="flex flex-col h-[500px]">
                  {/* Chat Message Logs */}
                  <div className="flex-1 overflow-y-auto space-y-4 p-4 border border-slate-100 rounded-2xl bg-slate-50/50 mb-4">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-8 space-y-3">
                        <MessageSquare className="w-12 h-12 text-slate-300" />
                        <h4 className="font-bold text-slate-700">AI Doubts Assistant</h4>
                        <p className="text-xs max-w-sm">Ask any doubts about this document. The assistant will answer using facts from the text and cite references.</p>
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none'}`}>
                            <div className="leading-relaxed">
                              {parseMarkdown(msg.content, msg.role === 'user')}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Chat Input form */}
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleSendChatMessage(); }}
                    className="flex gap-3"
                  >
                    <input
                      type="text"
                      placeholder="Ask a doubt about this document..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={sendingChat}
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || sendingChat}
                      className="px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-all flex items-center gap-1.5"
                    >
                      {sendingChat ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Send
                    </button>
                  </form>
                </div>
              )}

              {/* SEMANTIC SEARCH SUBTAB */}
              {studySubTab === 'search' && (
                <div className="space-y-6">
                  <form onSubmit={handleDocSearch} className="flex gap-3 max-w-2xl">
                    <div className="relative flex-1">
                      <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search key terms or concepts in this document..."
                        value={docSearchQuery}
                        onChange={(e) => setDocSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!docSearchQuery.trim() || searchingDoc}
                      className="px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-all flex items-center gap-1.5"
                    >
                      {searchingDoc ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Search"}
                    </button>
                  </form>

                  {searchingDoc ? (
                    <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
                      <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                      <p className="font-semibold text-sm">Searching vector space embeddings...</p>
                    </div>
                  ) : docSearchResults.length === 0 ? (
                    docSearchQuery ? (
                      <div className="py-12 text-center text-slate-400 text-sm">
                        No matches found. Try a different query.
                      </div>
                    ) : (
                      <div className="py-12 text-center text-slate-400 text-sm">
                        Enter a search query above to locate matching paragraphs with citation references.
                      </div>
                    )
                  ) : (
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-700 text-sm">Matched Text Paragraphs & Citations</h4>
                      <div className="grid grid-cols-1 gap-4">
                        {docSearchResults.map((match, idx) => (
                          <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 hover:border-indigo-100 hover:shadow-sm transition-all space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-1 rounded-full border border-indigo-100">
                                Source {idx + 1}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold">
                                Match Score: {(match.similarity * 100).toFixed(0)}%
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed italic">
                              "{match.content}"
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* QUIZ TAB */}
        {activeTab === 'quiz' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('dashboard')}
                className="p-2.5 rounded-xl bg-white border border-slate-100 hover:bg-slate-50 shadow-sm transition-all"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>

                <h3 className="text-2xl font-extrabold text-slate-800 line-clamp-1">{selectedDocTitle || "Adaptive Evaluation"}</h3>
              </div>
            </div>

            {loadingQuiz ? (
              <div className="bg-white rounded-3xl p-16 border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-4">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-slate-500 font-semibold text-sm">Generating adaptive questions using Gemini & Groq...</p>
              </div>
            ) : quizError ? (
              <div className="bg-white rounded-3xl p-16 border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-4 text-center">
                <AlertCircle className="w-12 h-12 text-rose-500" />
                <h4 className="text-lg font-bold text-slate-800">Quiz Generation Blocked</h4>
                <p className="text-slate-500 max-w-md text-xs">{quizError}</p>
                <button
                  onClick={() => startQuiz(selectedDocId, selectedDocTitle)}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                >
                  Retry Generation
                </button>
              </div>
            ) : quizQuestions.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 border border-slate-100 shadow-sm flex flex-col items-center justify-center gap-4 text-center">
                <BookOpen className="w-12 h-12 text-slate-300" />
                <h4 className="text-lg font-bold text-slate-700">No Document Selected</h4>
                <p className="text-slate-500 max-w-sm text-xs">Select a document card on the dashboard to test your knowledge.</p>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold"
                >
                  Go to Dashboard
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between gap-4">
                    <span className="text-xs font-bold text-slate-500">
                      Completion: <strong className="text-indigo-950">{String(currentQuestionIdx + 1).padStart(2, '0')} / {String(quizQuestions.length).padStart(2, '0')}</strong>
                    </span>
                    <div className="flex-1 max-w-[200px] h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${((currentQuestionIdx + 1) / quizQuestions.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border-l-4 border-l-indigo-600 border border-y-slate-100 border-r-slate-100 p-8 shadow-sm space-y-8 relative">
                    <p className="text-lg font-extrabold text-slate-900 leading-relaxed">
                      "{quizQuestions[currentQuestionIdx].question}"
                    </p>

                    <div className="grid grid-cols-1 gap-4">
                      {quizQuestions[currentQuestionIdx].options.map((option, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        const isSelected = selectedOption === idx;
                        const isCorrectAnswer = letter === quizQuestions[currentQuestionIdx].answer;

                        let optionClass = "border-slate-100 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-300";
                        if (isSelected) {
                          if (isConfirmed) {
                            optionClass = isCorrectAnswer
                              ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                              : "border-rose-500 bg-rose-50 text-rose-900";
                          } else {
                            optionClass = "border-indigo-600 bg-indigo-50/50 text-indigo-950 shadow-sm ring-1 ring-indigo-600";
                          }
                        } else if (isConfirmed && isCorrectAnswer) {
                          optionClass = "border-emerald-500 bg-emerald-50 text-emerald-900";
                        }

                        return (
                          <div
                            key={idx}
                            onClick={() => !isConfirmed && setSelectedOption(idx)}
                            className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 ${optionClass}`}
                          >
                            <div className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-sm ${isSelected ? 'bg-indigo-600 text-white shadow' : 'bg-slate-200/60 text-slate-600'}`}>
                              {letter}
                            </div>
                            <span className="text-sm font-semibold">{option}</span>
                          </div>
                        );
                      })}
                    </div>

                    {isConfirmed && (
                      <div className={`p-4 rounded-2xl flex items-center gap-3 border ${String.fromCharCode(65 + selectedOption!) === quizQuestions[currentQuestionIdx].answer
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}>
                        {String.fromCharCode(65 + selectedOption!) === quizQuestions[currentQuestionIdx].answer ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                            <span className="text-xs font-bold">Excellent! That's correct.</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-5 h-5 text-rose-600" />
                            <span className="text-xs font-bold">Incorrect! Correct answer is {quizQuestions[currentQuestionIdx].answer}.</span>
                          </>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                      <button
                        onClick={() => setActiveTab('dashboard')}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800"
                      >
                        BACK
                      </button>
                      {!isConfirmed ? (
                        <button
                          onClick={handleConfirmChoice}
                          disabled={selectedOption === null}
                          className="px-8 py-3 bg-indigo-600 disabled:opacity-50 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                        >
                          CONFIRM CHOICE
                        </button>
                      ) : (
                        <button
                          onClick={handleNextQuestion}
                          className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold active:scale-95 transition-all"
                        >
                          {currentQuestionIdx + 1 < quizQuestions.length ? 'NEXT QUESTION' : 'FINISH QUIZ'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-slate-950 text-xs tracking-wider uppercase">Certainty Index</h4>
                      <Sliders className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="space-y-4">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={certaintyIndex}
                        onChange={(e) => setCertaintyIndex(Number(e.target.value))}
                        className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                      />
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                        <span>UNCERTAIN</span>
                        <span className="text-indigo-600 text-xs">{certaintyIndex}%</span>
                        <span>ABSOLUTE</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed pt-2 border-t border-slate-50">
                      Neural analysis suggests honest assessment improves memory retention by <strong className="text-indigo-600">14%</strong>.
                    </p>
                  </div>

                  <div className="bg-white rounded-3xl p-6 border-2 border-indigo-500/30 shadow-sm space-y-4 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-indigo-950 text-xs tracking-wider uppercase">Performance Data</h4>
                      <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Accuracy</span>
                        <p className="text-2xl font-extrabold text-indigo-950">{overallProgress?.averageQuizGrade || "0%"}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Streak</span>
                        <p className="text-2xl font-extrabold text-orange-600 flex items-center gap-1">
                          <span>🔥</span> {streak || overallProgress?.streak || 0}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-50">
                      <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>PROGRESSION</span>
                        <span className="text-indigo-950">{(overallProgress?.xp || 0) + (score * 15)} XP</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full" style={{ width: `${Math.min((((overallProgress?.xp || 0) + (score * 15)) / 500) * 100, 100)}%` }}></div>
                      </div>
                    </div>

                    <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-start gap-2.5">
                      <span className="text-lg">🏆</span>
                      <div>
                        <h5 className="text-[11px] font-bold text-indigo-950">{overallProgress?.masteryLevel || "Novice"} Master</h5>
                        <p className="text-[9px] text-indigo-600 font-semibold">{overallProgress?.masteryLevelCode || "Level 5"} Status Reached.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-3xl p-5 text-white space-y-3 relative overflow-hidden group shadow-lg">
                    <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl"></div>
                    <div className="w-full aspect-[4/3] rounded-2xl bg-indigo-950/60 border border-indigo-800/40 relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.35),transparent_70%)]"></div>
                      <span className="text-4xl animate-bounce">🧠</span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[8px] bg-indigo-600 text-indigo-100 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Research Link</span>
                      <h5 className="text-xs font-bold text-slate-200 leading-tight truncate">{selectedDocTitle || "No Document Selected"}</h5>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === 'account' && currentUser && (
          <div className="space-y-8 animate-fadeIn max-w-2xl mx-auto">
            {/* Profile Header Card */}
            <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(99,102,241,0.25),transparent_60%)]" />
              <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
              <div className="relative z-10 flex flex-col items-center gap-4 text-center">
                <div className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-3xl font-extrabold text-white shadow-lg">
                  {getInitials(currentUser.name)}
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl font-extrabold tracking-tight">{currentUser.name}</h2>
                  <div className="flex items-center justify-center gap-2 text-indigo-200 text-sm">
                    <Mail className="w-4 h-4" />
                    <span>{currentUser.email}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-indigo-300/70 text-xs mt-1">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Verified Learner &bull; Active Account</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Details Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <Settings className="w-4 h-4 text-slate-500" />
                Account Details
              </h3>
              <div className="space-y-5">
                <div className="flex items-center justify-between py-3 border-b border-slate-50">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</span>
                  <span className="text-sm font-semibold text-slate-800">{currentUser.name}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-50">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</span>
                  <span className="text-sm font-semibold text-slate-800">{currentUser.email}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-50">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">User ID</span>
                  <span className="text-xs font-mono text-slate-500">{currentUser.id}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-50">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Documents Uploaded</span>
                  <span className="text-sm font-semibold text-slate-800">{documents.length}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-50">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Study Time</span>
                  <span className="text-sm font-semibold text-slate-800">{overallProgress?.totalStudyTime || '0.0 hrs'}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-slate-50">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Quizzes Taken</span>
                  <span className="text-sm font-semibold text-slate-800">{overallProgress?.quizzesTaken || 0}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Quiz Grade</span>
                  <span className="text-sm font-semibold text-slate-800">{overallProgress?.averageQuizGrade || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              className="w-full py-3.5 bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        )}

      </main>

      {/* Ingest Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsModalOpen(false)}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm transition-all"
          ></div>

          <div className="bg-white rounded-3xl w-full max-w-xl p-6 shadow-2xl relative z-10 border border-slate-100 animate-scaleUp">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl hover:bg-slate-100 transition-all text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 mb-4">Ingest Study Resource</h3>

            {/* Ingestion Type Toggle */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => setUploadType('pdf')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${uploadType === 'pdf' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                Upload PDF File
              </button>
              <button
                type="button"
                onClick={() => setUploadType('text')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${uploadType === 'text' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
              >
                Paste Plain Text
              </button>
            </div>

            <form onSubmit={handleIngest} className="space-y-4">
              {uploadType === 'pdf' ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all relative group bg-slate-50/50">
                    <input
                      type="file"
                      accept=".pdf"
                      required
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-all">
                      📄
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                      {selectedFile ? selectedFile.name : "Choose a PDF file or drag it here"}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">PDF document (Max. 10MB)</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-black uppercase tracking-wider">Document Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cognitive Arch Theory"
                      value={newDocTitle}
                      onChange={(e) => setNewDocTitle(e.target.value)}
                      className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-black uppercase tracking-wider">Resource text content</label>
                    <textarea
                      rows={6}
                      required
                      placeholder="Paste or write the text content of your study material here. Our AI engine will chunk it and compute semantic vector embeddings for RAG and Quiz Lab generation..."
                      value={newDocContent}
                      onChange={(e) => setNewDocContent(e.target.value)}
                      className="w-full px-4 py-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-black font-semibold"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={isIngesting}
                className="w-full py-3.5 bg-indigo-600 disabled:opacity-50 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {isIngesting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing & Embedding PDF...</span>
                  </>
                ) : (
                  <span>Submit to Knowledge Base</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 px-8 mt-auto flex flex-col md:flex-row items-center justify-between gap-4 text-slate-400 text-xs">
        <p>Learn-Sphere AI &copy; 2026. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-slate-600 transition-all">Support</a>
          <a href="#" className="hover:text-slate-600 transition-all">Privacy Policy</a>
          <a href="#" className="hover:text-slate-600 transition-all">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}

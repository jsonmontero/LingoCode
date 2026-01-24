import React, { useState, useEffect } from 'react';
import { Code, BookOpen, Trophy, Zap, Play, MessageSquare, Target, Lightbulb, Mic, MicOff, Save, Settings, Share2, RefreshCw } from 'lucide-react';

export default function LingoCode() {
  const [activeTab, setActiveTab] = useState('playground');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('// Write your JavaScript code here!\nlet greeting = "Hello World";\nconsole.log(greeting);');
  const [englishInput, setEnglishInput] = useState('');
  const [chatHistory, setChatHistory] = useState([{ role: 'assistant', content: '👋 Hi! I\'m your LingoCode AI Tutor! Ask me coding questions in English!' }]);
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [streak, setStreak] = useState(0);
  const [projectsCompleted, setProjectsCompleted] = useState(0);
  const [vocabularyLearned, setVocabularyLearned] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [n8nWebhook, setN8nWebhook] = useState('');
  const [lastSaved, setLastSaved] = useState(null);

  const [pyodideLoaded, setPyodideLoaded] = useState(false);
  const [pyodide, setPyodide] = useState(null);

  // Load Pyodide for Python execution
  useEffect(() => {
    const loadPyodide = async () => {
      try {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js';
        script.onload = async () => {
          const pyodideInstance = await window.loadPyodide({
            indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.24.1/full/'
          });
          setPyodide(pyodideInstance);
          setPyodideLoaded(true);
        };
        document.head.appendChild(script);
      } catch (error) {
        console.log('Pyodide load failed:', error);
      }
    };
    loadPyodide();
  }, []);

  const programmingLanguages = [
    { id: 'javascript', name: 'JavaScript', icon: '🟨', starter: '// JavaScript code\nlet greeting = "Hello World";\nconsole.log(greeting);' },
    { id: 'python', name: 'Python', icon: '🐍', starter: '# Python code\ngreeting = "Hello World"\nprint(greeting)' },
    { id: 'html', name: 'HTML/CSS', icon: '🌐', starter: '<!-- HTML code -->\n<h1>Hello World</h1>' },
    { id: 'java', name: 'Java', icon: '☕', starter: '// Java code\npublic class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello");\n  }\n}' },
  ];

  const miniProjects = [
    { id: 1, title: 'Calculator', difficulty: 'Beginner', description: 'Build a simple calculator', englishFocus: 'function, parameter, return', language: 'javascript' },
    { id: 2, title: 'Greeting Generator', difficulty: 'Beginner', description: 'Personalized greetings', englishFocus: 'if statement, variable, string', language: 'javascript' },
    { id: 3, title: 'Todo List', difficulty: 'Intermediate', description: 'Task manager app', englishFocus: 'array, push, filter, map', language: 'javascript' },
    { id: 4, title: 'Number Game', difficulty: 'Intermediate', description: 'Guessing game', englishFocus: 'random, loop, comparison', language: 'python' },
  ];

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.lang = 'en-US';
      recognitionInstance.onresult = (event) => {
        setEnglishInput(event.results[0][0].transcript);
        setIsListening(false);
      };
      recognitionInstance.onerror = () => setIsListening(false);
      recognitionInstance.onend = () => setIsListening(false);
      setRecognition(recognitionInstance);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('lingocode_progress');
    if (saved) {
      const progress = JSON.parse(saved);
      setStreak(progress.streak || 0);
      setProjectsCompleted(progress.projectsCompleted || 0);
      setVocabularyLearned(progress.vocabularyLearned || 0);
    }
    const savedWebhook = localStorage.getItem('lingocode_n8n_webhook');
    if (savedWebhook) setN8nWebhook(savedWebhook);
  }, []);

  useEffect(() => {
    const progress = { streak, projectsCompleted, vocabularyLearned, lastSaved: new Date().toISOString() };
    localStorage.setItem('lingocode_progress', JSON.stringify(progress));
    setLastSaved(new Date());
  }, [streak, projectsCompleted, vocabularyLearned]);

  const sendToN8n = async (eventType, data) => {
    if (!n8nWebhook) return;
    try {
      await fetch(n8nWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: eventType, timestamp: new Date().toISOString(), data })
      });
    } catch (error) {
      console.log('n8n webhook failed');
    }
  };

  const toggleVoiceInput = () => {
    if (!recognition) {
      alert('Voice input not supported. Use Chrome, Edge, or Safari.');
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (error) {
        setIsListening(false);
      }
    }
  };

  const changeLanguage = (langId) => {
    const lang = programmingLanguages.find(l => l.id === langId);
    setSelectedLanguage(langId);
    setCode(lang.starter);
    setOutput('');
    sendToN8n('language_changed', { language: lang.name });
  };

  const runCode = async () => {
    setOutput('🔄 Running code...');
    
    if (selectedLanguage === 'javascript') {
      try {
        const logs = [];
        const customConsole = { log: (...args) => logs.push(args.join(' ')) };
        const func = new Function('console', code);
        func(customConsole);
        setOutput(logs.length > 0 ? logs.join('\n') : '✅ Code executed successfully! (No console.log output)');
        sendToN8n('code_executed', { language: 'javascript', success: true });
        return;
      } catch (error) {
        setOutput(`❌ JavaScript Error:\n${error.message}\n\nTip: Check your syntax and try again!`);
        return;
      }
    }
    
    if (selectedLanguage === 'python') {
      if (!pyodideLoaded || !pyodide) {
        setOutput('🐍 Loading Python... Please wait a moment and try again.\n\n(Python is loading in the background for the first time)');
        return;
      }
      
      try {
        // Redirect Python output
        await pyodide.runPythonAsync(`
import sys
from io import StringIO
sys.stdout = StringIO()
        `);
        
        // Run user code
        await pyodide.runPythonAsync(code);
        
        // Get output
        const stdout = await pyodide.runPythonAsync('sys.stdout.getvalue()');
        
        setOutput(stdout || '✅ Python code executed! (No output)');
        sendToN8n('code_executed', { language: 'python', success: true });
      } catch (error) {
        setOutput(`❌ Python Error:\n${error.message}\n\nTip: Check your syntax!`);
      }
      return;
    }
    
    // For other languages - learning playground mode
    const languageNames = {
      'java': 'Java',
      'html': 'HTML/CSS'
    };
    
    const langName = languageNames[selectedLanguage] || selectedLanguage;
    
    setOutput(`💡 ${langName} Learning Playground

✅ Your code is saved and ready!
✅ Use the AI Tutor to review your code
✅ Ask: "Can you check my ${langName} code?"
✅ Get feedback on syntax and logic

🚀 To run ${langName} locally:
${selectedLanguage === 'java' ? '   javac Main.java && java Main' : ''}${selectedLanguage === 'html' ? '   Open your .html file in a browser' : ''}

📚 Pro tip: The AI Tutor can explain your code line-by-line in English!`);
  };

  const askAITutor = async () => {
    if (!englishInput.trim()) return;
    setIsLoading(true);
    const userMessage = { role: 'user', content: englishInput };
    setChatHistory(prev => [...prev, userMessage]);
    
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: `You are LingoCode AI Tutor. Help learn programming and English. If their English has mistakes, correct gently first. Then answer their coding question with examples. Add 2-3 vocabulary words.\n\nUser: "${englishInput}"` }]
        })
      });
      const data = await response.json();
      const aiResponse = data.content?.[0]?.text || 'Sorry, please try again!';
      setChatHistory(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      setEnglishInput('');
      setVocabularyLearned(prev => prev + 2);
      sendToN8n('ai_interaction', { question: englishInput });
    } catch (error) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: '⚠️ Connection error! Try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startProject = (project) => {
    setActiveTab('playground');
    setSelectedLanguage(project.language);
    const commentChar = project.language === 'javascript' || project.language === 'java' ? '//' : '#';
    setCode(`${commentChar} 🎯 Project: ${project.title}\n${commentChar} ${project.description}\n${commentChar} Learn: ${project.englishFocus}\n\n`);
    setOutput(`📋 Project loaded: ${project.title}\nClick "Run" to test your code!`);
    setProjectsCompleted(prev => prev + 1);
    sendToN8n('project_started', { projectName: project.title });
  };

  const shareApp = async () => {
    const text = `I'm learning code & English with LingoCode! ${streak} day streak, ${projectsCompleted} projects! 🚀\n\nTry it: ${window.location.href}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'LingoCode', text, url: window.location.href });
      } catch (e) {
        navigator.clipboard.writeText(text);
        alert('Share text copied to clipboard! 📋');
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Share text copied to clipboard! 📋');
    }
  };

  const resetProgress = () => {
    if (confirm('Reset all progress? This cannot be undone!')) {
      localStorage.clear();
      setStreak(0);
      setProjectsCompleted(0);
      setVocabularyLearned(0);
      alert('Progress reset!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <div className="bg-black bg-opacity-30 backdrop-blur-sm border-b border-white border-opacity-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-xl shadow-lg">
                <Code size={28} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-300 to-orange-400 bg-clip-text text-transparent">LingoCode</h1>
                <p className="text-blue-200 text-xs md:text-sm">Code in English, Learn Both! 🚀</p>
              </div>
            </div>
            <div className="flex gap-4 items-center flex-wrap">
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-yellow-300">
                    <Zap size={18} />
                    <span className="text-xl font-bold">{streak}</span>
                  </div>
                  <p className="text-xs text-blue-200">Streak</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-green-300">
                    <Trophy size={18} />
                    <span className="text-xl font-bold">{projectsCompleted}</span>
                  </div>
                  <p className="text-xs text-blue-200">Projects</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-pink-300">
                    <BookOpen size={18} />
                    <span className="text-xl font-bold">{vocabularyLearned}</span>
                  </div>
                  <p className="text-xs text-blue-200">Words</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={shareApp} className="p-2 bg-blue-500 bg-opacity-30 hover:bg-opacity-50 rounded-lg transition-all" title="Share">
                  <Share2 size={18} />
                </button>
                <button onClick={() => setShowSettings(!showSettings)} className="p-2 bg-purple-500 bg-opacity-30 hover:bg-opacity-50 rounded-lg transition-all" title="Settings">
                  <Settings size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSettings && (
        <div className="bg-black bg-opacity-50 backdrop-blur-sm border-b border-white border-opacity-20">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h3 className="text-xl font-bold text-yellow-300 mb-4">⚙️ Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-blue-200 mb-2">n8n Webhook URL</label>
                <input
                  type="text"
                  value={n8nWebhook}
                  onChange={(e) => {
                    setN8nWebhook(e.target.value);
                    localStorage.setItem('lingocode_n8n_webhook', e.target.value);
                  }}
                  placeholder="https://your-n8n.cloud/webhook/..."
                  className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <button onClick={resetProgress} className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-all text-sm">
                <RefreshCw size={16} />
                Reset Progress
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="flex gap-2 bg-black bg-opacity-30 p-1 rounded-lg backdrop-blur-sm overflow-x-auto">
          <button onClick={() => setActiveTab('playground')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${activeTab === 'playground' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' : 'text-blue-200 hover:bg-white hover:bg-opacity-10'}`}>
            <Play size={18} />
            Playground
          </button>
          <button onClick={() => setActiveTab('tutor')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${activeTab === 'tutor' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' : 'text-blue-200 hover:bg-white hover:bg-opacity-10'}`}>
            <MessageSquare size={18} />
            AI Tutor
          </button>
          <button onClick={() => setActiveTab('projects')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${activeTab === 'projects' ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' : 'text-blue-200 hover:bg-white hover:bg-opacity-10'}`}>
            <Target size={18} />
            Projects
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'playground' && (
          <div>
            <div className="mb-6 bg-black bg-opacity-40 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20">
              <h3 className="text-lg font-bold text-yellow-300 mb-4">🌍 Choose Language:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {programmingLanguages.map((lang) => (
                  <button key={lang.id} onClick={() => changeLanguage(lang.id)} className={`p-3 rounded-lg font-semibold transition-all border-2 ${selectedLanguage === lang.id ? 'bg-gradient-to-r from-blue-500 to-purple-500 border-yellow-400 text-white shadow-lg' : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-blue-400'}`}>
                    <div className="text-2xl mb-1">{lang.icon}</div>
                    <div className="text-xs">{lang.name}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-yellow-300 flex items-center gap-2">
                    <Code size={20} />
                    Editor
                  </h2>
                  <button onClick={runCode} className="bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2 text-sm">
                    <Play size={16} />
                    Run
                  </button>
                </div>
                <textarea value={code} onChange={(e) => setCode(e.target.value)} className="w-full h-80 bg-gray-900 text-green-300 p-3 rounded-lg font-mono text-sm border border-gray-700 focus:outline-none focus:border-blue-500" spellCheck="false" />
              </div>

              <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20">
                <h2 className="text-lg font-bold text-green-300 mb-3 flex items-center gap-2">
                  <Lightbulb size={20} />
                  Output
                </h2>
                <div className="bg-gray-900 p-3 rounded-lg h-80 overflow-y-auto border border-gray-700">
                  <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">{output || '👉 Write code and click "Run"!'}</pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tutor' && (
          <div className="bg-black bg-opacity-40 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20">
            <h2 className="text-xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
              <MessageSquare size={24} />
              AI English Tutor
            </h2>
            <div className="bg-gray-900 rounded-lg p-3 h-80 overflow-y-auto mb-4 border border-gray-700">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block max-w-lg p-2 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-100'}`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && <div className="text-left"><div className="inline-block bg-gray-800 p-2 rounded-lg"><p className="text-gray-400 text-sm">Thinking... 🤔</p></div></div>}
            </div>
            <div className="flex gap-2">
              <button onClick={toggleVoiceInput} className={`p-2 rounded-lg transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-blue-500 hover:bg-blue-600'}`}>
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <input type="text" value={englishInput} onChange={(e) => setEnglishInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && askAITutor()} placeholder="Ask in English... or click 🎤" className="flex-1 bg-gray-900 text-white px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 text-sm" disabled={isLoading} />
              <button onClick={askAITutor} disabled={isLoading || !englishInput.trim()} className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-2 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 text-sm">
                Send
              </button>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div>
            <h2 className="text-xl font-bold text-yellow-300 mb-4 flex items-center gap-2">
              <Target size={24} />
              Mini Projects
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {miniProjects.map((project) => (
                <div key={project.id} className="bg-black bg-opacity-40 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20 hover:border-yellow-400 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-white">{project.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${project.difficulty === 'Beginner' ? 'bg-green-500' : 'bg-orange-500'}`}>
                      {project.difficulty}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-2 text-sm">{project.description}</p>
                  <div className="bg-blue-900 bg-opacity-30 p-2 rounded-lg mb-3">
                    <p className="text-xs text-blue-200">📚 {project.englishFocus}</p>
                  </div>
                  <button onClick={() => startProject(project)} className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all text-sm">
                    Start →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
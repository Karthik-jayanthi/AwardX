
import React, { useState, useEffect } from 'react';
import { db, Judge } from '../../services/demoDb';
import { Gavel, CheckCircle2, Clock, Mail, Plus, Settings, Sliders, Trash2 } from 'lucide-react';
import { Button } from '../Button';

export const JudgingView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'panel' | 'scorecard'>('overview');
  const [judges, setJudges] = useState<Judge[]>([]);
  const [criteria, setCriteria] = useState([
     { id: 1, name: 'Innovation & Creativity', weight: 40, description: 'Originality of the idea.' },
     { id: 2, name: 'Technical Execution', weight: 30, description: 'Quality of implementation.' },
     { id: 3, name: 'Impact & Results', weight: 30, description: 'Measurable outcomes.' },
  ]);

  useEffect(() => {
    setJudges(db.getJudges());
  }, []);

  const totalProgress = Math.round(judges.reduce((acc, curr) => acc + curr.progress, 0) / (judges.length || 1));
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Judging Management</h1>
          <p className="text-slate-500">Track scoring progress and manage your panel.</p>
        </div>
        <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
           {['overview', 'panel', 'scorecard'].map((tab) => (
              <button
                 key={tab}
                 onClick={() => setActiveTab(tab as any)}
                 className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab 
                    ? 'bg-slate-900 text-white shadow' 
                    : 'text-slate-500 hover:text-slate-900'
                 }`}
              >
                 {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
           ))}
        </div>
      </div>

      {activeTab === 'overview' && (
         <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                       <Gavel className="w-6 h-6 text-white" />
                    </div>
                    <div>
                       <div className="text-indigo-100 text-sm font-medium">Overall Progress</div>
                       <div className="text-2xl font-bold">{totalProgress}%</div>
                    </div>
                 </div>
                 <div className="w-full bg-indigo-900/30 rounded-full h-2">
                    <div className="bg-white h-2 rounded-full transition-all duration-1000" style={{ width: `${totalProgress}%` }}></div>
                 </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
                 <div className="p-3 bg-green-50 rounded-xl text-green-600">
                    <CheckCircle2 className="w-6 h-6" />
                 </div>
                 <div>
                    <div className="text-slate-500 text-sm font-medium">Completed Scores</div>
                    <div className="text-2xl font-bold text-slate-900">
                       {judges.reduce((acc, curr) => acc + curr.completedCount, 0)}
                    </div>
                 </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
                 <div className="p-3 bg-orange-50 rounded-xl text-orange-600">
                    <Clock className="w-6 h-6" />
                 </div>
                 <div>
                    <div className="text-slate-500 text-sm font-medium">Pending Reviews</div>
                    <div className="text-2xl font-bold text-slate-900">
                       {judges.reduce((acc, curr) => acc + (curr.assignedCount - curr.completedCount), 0)}
                    </div>
                 </div>
              </div>
            </div>
         </div>
      )}

      {activeTab === 'panel' && (
         <div className="space-y-6">
            <div className="flex justify-between items-center">
               <h2 className="text-lg font-bold text-slate-900">Judge Panel</h2>
               <Button size="sm" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Invite Judge
               </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {judges.map((judge) => (
                  <div key={judge.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow group">
                     <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                           <img src={judge.avatar} alt={judge.name} className="w-12 h-12 rounded-full border-2 border-slate-100" />
                           <div>
                              <div className="font-bold text-slate-900">{judge.name}</div>
                              <div className="text-xs text-slate-500">{judge.email}</div>
                           </div>
                        </div>
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                           judge.status === 'Active' ? 'bg-green-100 text-green-700' : 
                           judge.status === 'Completed' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                           {judge.status}
                        </span>
                     </div>

                     <div className="mb-4">
                        <div className="flex justify-between text-xs font-semibold text-slate-500 mb-2">
                           <span>Progress</span>
                           <span>{judge.completedCount}/{judge.assignedCount}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                           <div className={`h-2 rounded-full ${
                              judge.progress === 100 ? 'bg-green-500' : 'bg-indigo-500'
                           }`} style={{ width: `${judge.progress}%` }}></div>
                        </div>
                     </div>

                     <div className="flex gap-2">
                        <button className="flex-1 py-2 text-sm font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-100">
                           View Scores
                        </button>
                        <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-100">
                           <Mail className="w-4 h-4" />
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      )}

      {activeTab === 'scorecard' && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                     <h2 className="text-lg font-bold text-slate-900">Scorecard Criteria</h2>
                     <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-2" /> Add Criterion</Button>
                  </div>
                  
                  <div className="space-y-4">
                     {criteria.map((c, idx) => (
                        <div key={c.id} className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 group">
                           <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                 <h4 className="font-bold text-slate-900">{c.name}</h4>
                                 <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold">{c.weight}%</span>
                              </div>
                              <p className="text-xs text-slate-500">{c.description}</p>
                           </div>
                           <div className="w-32">
                              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                 <div className="h-full bg-indigo-500" style={{ width: `${c.weight}%` }}></div>
                              </div>
                           </div>
                           <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg"><Settings className="w-4 h-4" /></button>
                              <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg"><Trash2 className="w-4 h-4" /></button>
                           </div>
                        </div>
                     ))}
                  </div>

                  {totalWeight !== 100 && (
                     <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        Total weight must equal 100% (Current: {totalWeight}%)
                     </div>
                  )}
               </div>
            </div>

            <div className="space-y-6">
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                     <Sliders className="w-4 h-4 text-slate-400" /> Scoring Settings
                  </h3>
                  <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Scoring System</label>
                        <select className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none text-sm">
                           <option>Numeric (0-10)</option>
                           <option>Numeric (0-100)</option>
                           <option>Star Rating (1-5)</option>
                           <option>Pass / Fail</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Pass Threshold</label>
                        <input type="number" className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none text-sm" placeholder="e.g. 7.0" />
                     </div>
                     <div className="pt-2">
                        <label className="flex items-center cursor-pointer">
                           <input type="checkbox" className="mr-2 accent-indigo-600" defaultChecked />
                           <span className="text-sm text-slate-600">Allow Judge Comments</span>
                        </label>
                     </div>
                     <div>
                        <label className="flex items-center cursor-pointer">
                           <input type="checkbox" className="mr-2 accent-indigo-600" />
                           <span className="text-sm text-slate-600">Blind Judging (Hide Applicant Name)</span>
                        </label>
                     </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-slate-100">
                     <Button className="w-full">Save Configuration</Button>
                  </div>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

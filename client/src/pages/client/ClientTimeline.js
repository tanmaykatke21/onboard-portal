import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Layout from "../../components/Layout";
import API from "../../services/api";

function ClientTimeline() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.projectId) { setLoading(false); return; }
      try {
        const { data } = await API.get(`/timeline/project/${user.projectId}`);
        setTasks(data.tasks || []);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [user]);

  if (loading) return <Layout><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div></Layout>;

  const phases = [...new Set(tasks.map((t) => t.phase))];
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Timeline</h1>
      <p className="text-gray-500 text-sm mb-6">{completedCount} of {tasks.length} tasks completed</p>

      {/* Progress Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-bold text-blue-600">{progress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div className="bg-blue-600 rounded-full h-3 transition-all duration-500" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400">No timeline tasks yet. Your admin will add milestones soon.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {phases.map((phase) => (
            <div key={phase}>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">{phase}</h2>
              <div className="space-y-2">
                {tasks.filter((t) => t.phase === phase).map((task) => (
                  <div key={task._id} className={`bg-white rounded-xl border p-4 flex items-start gap-4 transition ${
                    task.status === "completed" ? "border-green-200 bg-green-50/30" : "border-gray-200"
                  }`}>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      task.status === "completed" ? "bg-green-500 border-green-500 text-white" :
                      task.status === "in-progress" ? "border-blue-500 bg-blue-50" : "border-gray-300"
                    }`}>
                      {task.status === "completed" && <span className="text-xs">✓</span>}
                      {task.status === "in-progress" && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-sm font-medium ${task.status === "completed" ? "text-gray-400 line-through" : "text-gray-900"}`}>{task.taskName}</h3>
                      {task.description && <p className="text-xs text-gray-400 mt-1">{task.description}</p>}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      task.status === "completed" ? "bg-green-50 text-green-700" :
                      task.status === "in-progress" ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-500"
                    }`}>{task.status}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

export default ClientTimeline;

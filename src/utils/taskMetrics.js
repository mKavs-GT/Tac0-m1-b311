/**
 * Task Metrics Utility
 * 
 * Calculates completion stats for a specific user across projects and sprints.
 */

export const calculateDailyGoal = (projects, user) => {
  if (!projects || !user) return { completed: 0, total: 0, percent: 0 };

  let totalTasks = 0;
  let completedTasks = 0;

  projects.forEach(project => {
    if (project.sprints && project.sprints.length > 0) {
      project.sprints.forEach(sprint => {
        if (sprint.columns) {
          const columns = sprint.columns;
          const allColumnKeys = Object.keys(columns); // allTasks, ongoing, testing, live
          
          allColumnKeys.forEach(colKey => {
            const tasks = columns[colKey] || [];
            tasks.forEach(task => {
              // Check if user is assigned to this task
              const isAssigned = task.assignees && task.assignees.some(a => 
                (a.userId && a.userId === user.uid) ||
                (a.userId && a.userId === user.email) ||
                (a.email && a.email.toLowerCase() === user.email?.toLowerCase())
              );

              if (isAssigned) {
                totalTasks++;
                if (colKey === 'live') {
                  completedTasks++;
                }
              }
            });
          });
        }
      });
    }
  });

  const percent = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return {
    completed: completedTasks,
    total: totalTasks,
    percent: percent
  };
};

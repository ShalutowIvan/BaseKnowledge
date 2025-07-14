// KnowledgeLayout.jsx
import { Outlet } from 'react-router-dom';
import { ProjectsAll } from './ProjectsAll';

function ProjectLayout() {
  return (
    <div className="knowledge-container">
      {/* Боковая панель с группами (постоянная) */}
      <ProjectsAll />
      
      {/* Основной контент (меняется) */}
      
      <div>
        <Outlet />
      </div>
    </div>
  );
}


export { ProjectLayout }
// KnowledgeLayout.jsx
import { Outlet } from 'react-router-dom';
import { GroupsAll } from './GroupsAll';

function KnowledgeLayout() {
  return (
    <div className="knowledge-container">
      {/* Боковая панель с группами (постоянная) */}
      <GroupsAll />
      
      {/* Основной контент (меняется) */}
      {/*<div className="knowledge-content">*/}
      <div>
        <Outlet />
      </div>
    </div>
  );
}


export { KnowledgeLayout }
// KnowledgeLayout.jsx
import { Outlet, useLoaderData } from 'react-router-dom';
import { GroupsAll } from './GroupsAll';

function KnowledgeLayout() {
  

  return (

    <div>
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
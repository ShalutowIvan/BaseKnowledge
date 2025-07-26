import { Outlet, useParams } from 'react-router-dom';
import { SectionAllProject } from './SectionAllProject';


//тут компонент отрисовывается при открытии проекта с Outlet в середине, который будет меняться при открытии разделов или других частей в проекте. 

function ProjectOpenLayout() {
  const { project_id } = useParams()
      
  return (
    <div>
      {/* Боковая панель с группами (постоянная) */}
      <SectionAllProject project_id={project_id} />
      
      {/* Основной контент (меняется) */}      
      <div>
        <Outlet />
      </div>
    </div>
  );
}





export { ProjectOpenLayout };
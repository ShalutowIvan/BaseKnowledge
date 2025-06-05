import { Route, createBrowserRouter, createRoutesFromElements } from "react-router-dom";

import { Start } from './start/Start';

import { KnowledgePageView } from './sections/BaseKnowledge/KnowledgePageView';
import { GroupCreate } from './sections/BaseKnowledge/GroupCreate';



import { ProjectManagement } from './sections/ProjectManagement/ProjectManagement';
import { RoadMap } from './sections/RoadMap/RoadMap';







const AppRouter = createBrowserRouter(createRoutesFromElements(
       
	<Route path="/" element={
        // <AuthProvider>
              <Start /> 
        // </AuthProvider>
         } >
            {/* база знаний */}
          <Route path="baseknowledge/" element={<KnowledgePageView />}  />
          <Route path="group/create/" element={<GroupCreate />}  />
          
          {/* проекты */}
          <Route path="ProjectManagement/" element={<ProjectManagement />}  />
          
          
          {/* дорожные карты */}
          <Route path="RoadMap/" element={<RoadMap />}  />
        

        </Route>

        


	))



export default AppRouter    
     
        


import { Route, createBrowserRouter, createRoutesFromElements } from "react-router-dom";

import { Start } from './start/Start';

import { KnowledgePageView } from './sections/BaseKnowledge/KnowledgePageView';
import { KnowledgeInGroup } from './sections/BaseKnowledge/KnowledgeInGroup';
import { GroupCreate } from './sections/BaseKnowledge/GroupCreate';
import { KnowledgeCreate } from './sections/BaseKnowledge/KnowledgeCreate';
import { KnowledgeOpen, KnowledgeOpenLoader } from './sections/BaseKnowledge/KnowledgeOpen';


import { ProjectManagement } from './sections/ProjectManagement/ProjectManagement';
import { RoadMap } from './sections/RoadMap/RoadMap';







const AppRouter = createBrowserRouter(createRoutesFromElements(
       
	<Route path="/" element={
        // <AuthProvider>
              <Start /> 
        // </AuthProvider>
         } >
            {/* база знаний */}
          <Route path="group/create/" element={<GroupCreate />}  />
          <Route path="knowledge/" element={<KnowledgePageView />}  />
          <Route path="knowledge/:slug" element={<KnowledgeInGroup />}  />       
          <Route path="knowledge/create/" element={<KnowledgeCreate />}  />
          {/*loader={KnowledgeOpenLoader}*/}
          <Route path="knowledge/open/:slug" element={<KnowledgeOpen />} loader={KnowledgeOpenLoader} />
          
          {/* проекты */}
          <Route path="ProjectManagement/" element={<ProjectManagement />}  />
          
          
          {/* дорожные карты */}
          <Route path="RoadMap/" element={<RoadMap />}  />
        

        </Route>

        


	))



export default AppRouter    
     
        


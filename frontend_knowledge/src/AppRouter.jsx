import { Route, createBrowserRouter, createRoutesFromElements } from "react-router-dom";

import { Start } from './start/Start';

import { BaseKnowledge } from './sections/BaseKnowledge/BaseKnowledge';
import { ProjectManagement } from './sections/ProjectManagement/ProjectManagement';
import { RoadMap } from './sections/RoadMap/RoadMap';







const AppRouter = createBrowserRouter(createRoutesFromElements(
       
	<Route path="/" element={
        // <AuthProvider>
              <Start /> 
        // </AuthProvider>
         } >

          <Route path="BaseKnowledge/" element={<BaseKnowledge />}  />          
          <Route path="ProjectManagement/" element={<ProjectManagement />}  />
          <Route path="RoadMap/" element={<RoadMap />}  />
        

        </Route>

        


	))



export default AppRouter    
     
        


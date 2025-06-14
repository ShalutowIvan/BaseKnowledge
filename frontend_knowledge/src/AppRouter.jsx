import { Route, createBrowserRouter, createRoutesFromElements } from "react-router-dom";

import { Start } from './start/Start';

import { KnowledgePageView, KnowledgeListLoader } from './sections/BaseKnowledge/KnowledgePageView';
import { KnowledgeInGroup } from './sections/BaseKnowledge/KnowledgeInGroup';
import { GroupCreate } from './sections/BaseKnowledge/GroupCreate';
import { KnowledgeCreate } from './sections/BaseKnowledge/KnowledgeCreate';
import { KnowledgeOpen, KnowledgeOpenLoader } from './sections/BaseKnowledge/KnowledgeOpen';


import { ProjectManagement } from './sections/ProjectManagement/ProjectManagement';
import { RoadMap } from './sections/RoadMap/RoadMap';


// пользователи
import Authorization from './regusers/Authorization';
import Registration from './regusers/Registration';
import Registration_verify from './regusers/Registration_verify';

import Forgot_password from './regusers/Forgot_password';
import Forgot_password_verify from './regusers/Forgot_password_verify';
import { AuthProvider } from "./regusers/AuthProvider";
import { Private } from "./regusers/Private";



const AppRouter = createBrowserRouter(createRoutesFromElements(
       
	<Route path="/" element={
        <AuthProvider>
              <Start /> 
         </AuthProvider>
         } >

            {/* пользователи */}
            <Route path="regusers/authorization/" element={<Authorization />} />
          
            <Route path="regusers/registration/" element={<Registration />} />
            <Route path="regusers/registration_verify/:token"
                  element={<Registration_verify />}                 
            />

            <Route path="regusers/forgot_password/" element={<Forgot_password />} />
            <Route path="regusers/forgot_password_verify/:token" element={<Forgot_password_verify />} />

            {/* база знаний */}
          <Route path="group/create/" element={<GroupCreate />}  />
          <Route path="knowledge/" element={<KnowledgePageView />} loader={KnowledgeListLoader}  />
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
     
        


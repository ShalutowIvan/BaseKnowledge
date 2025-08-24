import { Route, createBrowserRouter, createRoutesFromElements } from "react-router-dom";

import { Start } from './start/Start';

//знания
import { KnowledgeLayout} from './sections/BaseKnowledge/KnowledgeLayout';
import { KnowledgePageView, KnowledgeListLoader } from './sections/BaseKnowledge/KnowledgePageView';
import { KnowledgeInGroup } from './sections/BaseKnowledge/KnowledgeInGroup';
import { GroupCreate } from './sections/BaseKnowledge/GroupCreate';
import { KnowledgeCreate } from './sections/BaseKnowledge/KnowledgeCreate';
import { KnowledgeOpen, KnowledgeOpenLoader } from './sections/BaseKnowledge/KnowledgeOpen';


//проекты
import { ProjectPageView, ProjectListLoader } from './sections/ProjectManagement/ProjectPageView';
import { ProjectOpenLayout, ProjectOpenLoader } from './sections/ProjectManagement/ProjectOpenLayout';
import { ProjectOpenIndex } from './sections/ProjectManagement/ProjectOpenIndex';
// import { ProjectOpen, ProjectOpenLoader } from './sections/ProjectManagement/ProjectOpen';
// import { SectionCreate } from './sections/ProjectManagement/SectionCreate';
import { SectionOpen, SectionOpenLoader } from './sections/ProjectManagement/SectionOpen';
import { TaskOpen, TaskOpenLoader } from './sections/ProjectManagement/TaskOpen';
import { ProjectOpenUsers } from './sections/ProjectManagement/ProjectOpenUsers';


// пользователи
import Authorization from './regusers/Authorization';
import Registration from './regusers/Registration';
import Registration_verify from './regusers/Registration_verify';
import Forgot_password from './regusers/Forgot_password';
import Forgot_password_verify from './regusers/Forgot_password_verify';
import { AuthProvider } from "./regusers/AuthProvider";
import { Registration_after } from "./regusers/Registration_after";


// Дорожные карты
import { RoadMapList, RoadMapListLoader } from './sections/RoadMap/RoadMapList';
import { RoadMapOpenLayout, RoadMapOpenLoader } from './sections/RoadMap/RoadMapOpenLayout';
import { RoadMapOpenIndex } from './sections/RoadMap/RoadMapOpenIndex';
import { ChapterOpen, ChapterOpenLoader } from './sections/RoadMap/ChapterOpenLayout';
import { ChapterOpenIndex } from './sections/RoadMap/ChapterOpenIndex';
import { StageOpen, StageOpenLoader } from './sections/RoadMap/StageOpen';
import { RoadMapOpenSettings } from './sections/RoadMap/RoadMapOpenSettings';


const AppRouter = createBrowserRouter(createRoutesFromElements(
       
	<Route path="/" element={
        <AuthProvider>
              <Start /> 
         </AuthProvider>
         } >

            {/* пользователи */}
            <Route path="regusers/authorization/" element={<Authorization />} />
          
            <Route path="regusers/registration/" element={<Registration />} />
            <Route path="regusers/registration/check_mail/" element={<Registration_after />} />
            <Route path="regusers/registration_verify/:token"
                  element={<Registration_verify />}                 
            />

            <Route path="regusers/forgot_password/" element={<Forgot_password />} />
            <Route path="regusers/forgot_password_verify/:token" element={<Forgot_password_verify />} />



          {/* база знаний */}                    

          <Route path="knowledges" element={<KnowledgeLayout />}>
            {/* Основные маршруты знаний */}
            <Route index element={<KnowledgePageView />} loader={KnowledgeListLoader} />
            <Route path=":slug" element={<KnowledgeInGroup />} />
            <Route path="create/" element={<KnowledgeCreate />} />
            <Route path="open/:slug" element={<KnowledgeOpen />} loader={KnowledgeOpenLoader} />
            <Route path="group/create/" element={<GroupCreate />}  />
          </Route>


          {/* проекты */}
          
          <Route path="projects/" element={<ProjectPageView />} loader={ProjectListLoader} />
                    
          {/* тут открывающий роут, далее вложенные */}
          <Route path="projects/open/:project_id" element={<ProjectOpenLayout />} loader={ProjectOpenLoader}>

            <Route index element={<ProjectOpenIndex />} />
                        
            <Route path="section_open/:section_id" element={<SectionOpen />} loader={SectionOpenLoader} />
            <Route path="section_open/:section_id/task_open/:task_id" element={<TaskOpen />} loader={TaskOpenLoader} />
            <Route path="users_invite" element={<ProjectOpenUsers />} />
          </Route>



          {/* <Route path="group/create/" element={<GroupCreate />}  />  */}          
          {/* <Route path=":slug" element={<KnowledgeInGroup />} /> */}
          
          
          
          
          {/* дорожные карты */}
          <Route path="roadmaps/" element={<RoadMapList />} loader={RoadMapListLoader} />

          <Route path="roadmaps/open/:roadmap_id" element={<RoadMapOpenLayout />} loader={RoadMapOpenLoader}>

            <Route index element={<RoadMapOpenIndex />} />
                        
            <Route path="chapter_open/:chapter_id" element={<ChapterOpen />} loader={ChapterOpenLoader}>
              <Route index element={<ChapterOpenIndex />} />            
              <Route path="stage_open/:stage_id" element={<StageOpen />} loader={StageOpenLoader} />
            </Route>

            <Route path="settings" element={<RoadMapOpenSettings />} />
            
          </Route>
        

        </Route>       


	))



export default AppRouter    
     
        


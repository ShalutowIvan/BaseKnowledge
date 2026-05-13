import { Route, createBrowserRouter, createRoutesFromElements } from "react-router-dom";

import { Start } from './start/Start';
import { StartIndex } from './start/StartIndex';



const AppRouter = createBrowserRouter(createRoutesFromElements(
  
  <>

	<Route path="/" element={
        // <AuthProvider>
              <Start /> 
         // </AuthProvider>
         } >
         {/*<Route index element={<StartIndex />} />*/}

          
          {/* пользователи */}
          {/*<Route path="regusers/authorization/" element={<Authorization />} />          
          <Route path="regusers/registration/" element={<Registration />} />
          <Route path="regusers/registration/check_mail/" element={<Registration_after />} />
          <Route path="regusers/registration_verify/:token" element={<Registration_verify />} />
          <Route path="regusers/forgot_password/" element={<Forgot_password />} />
          <Route path="regusers/forgot_password_verify/:token" element={<Forgot_password_verify />} />*/}
        

    
  </Route>

  
  
  </>


	))



export default AppRouter    
     
        


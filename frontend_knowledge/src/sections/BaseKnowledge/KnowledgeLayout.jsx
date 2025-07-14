// KnowledgeLayout.jsx
import { Outlet, useLoaderData } from 'react-router-dom';
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


// async function getGroupList() { 
//   const res = await fetch("http://127.0.0.1:8000/groups_all/")

//   // try {
//   //       const res = await API.get(`/api/checkout_list/orders/${id}`)     
//   //  return res.data
//   //     } catch (error) {
//   //      //если ошибка, то выдаем ошибку
//   //       console.error("Error here: ", error);
//   //       // setError("Failed to fetch user data. Please try again.");
//   //       return "error"
//   //     }

//   return res.json()
// }


// const GroupListLoader = async () => {  
//   return {groupsLoad: await getGroupList()}

// }


export { KnowledgeLayout }
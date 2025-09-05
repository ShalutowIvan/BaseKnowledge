import { NavLink, useLoaderData, useNavigate, useLocation, Link, Outlet } from 'react-router-dom'
import { useState, useEffect, Fragment, useCallback } from 'react'
import { API } from '../../apiAxios/apiAxios'
import { DeleteGroupModal } from './DeleteGroupModal'
import { GroupCreateModal } from './GroupCreateModal'

import { FaTrash } from "react-icons/fa";
import { DropdownMenu } from './DropdownMenu'; 


function KnowledgeLayout() {

  const setActive = ({isActive}) => isActive ? 'active-link' : '';  
  const [groups, setGroups] = useState([]);

  const { groupsLoad } = useLoaderData();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const [modalDeleteGroup, setModalDeleteGroup] = useState(false);
  const [modalCreateGroup, setModalCreateGroup] = useState(false);  
  
  
  const [selectedGroup, setSelectedGroup] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();


  if (groupsLoad?.error) {
    return (
      <h1 style={{ textAlign: 'center', marginTop: '200px', color: 'white' }}>Ошибка: {groupsLoad.error}. Пройдите авторизацию.</h1>
      )
  }

  //передаем объект группы в компонент модального окна. 
  const handleDeleteClick = (group) => {
      setSelectedGroup(group);      
      setModalDeleteGroup(true);
      };


  const handleDeleteSuccess = () => {
      // Обновляем список групп после удаления
      setGroups(groups.filter(g => g.id !== selectedGroup.id));
      };

  
  useEffect(() => {
    const fetchData = async () => {
    try {

      if (groupsLoad && !groupsLoad.error) {
          // Убедимся, что groupsLoad - массив
          const groupsArray = Array.isArray(groupsLoad) ? groupsLoad : [];
          setGroups(prevItems => 
              groupsArray.map(item => ({
                ...item,                        
                isEditing: false
              })));
          }

      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.detail);
      console.log("Ошибка из лейаут", err.response?.data?.detail)
      setLoading(false);
    }
    };
    fetchData()
    
  }, [])


  const create_group = () => {
      return navigate("/knowledges/group/create/");
    }


  const create_knowledge = () => {
      return navigate("/knowledges/create/");
    }  
  

  const setGroupName = useCallback((group_id) => (e) => {
      const { name, value } = e.target;
      setGroups(prev => prev.map(item => 
        item.id === group_id ? { ...item, [name]: value } : item
      ));
    }, []);

  const validateFormArray = (groupId) => {
        const foundItemForm = groups.find(item => item.id === groupId);
        // console.log("ID", foundItemForm)
        // Проверяем, найден ли элемент
        if (!foundItemForm) {
            setError("Элемент не найден!");
            return false;
        }
        
        // Проверяем поля на пустоту (включая пустые строки)
        if (!foundItemForm?.name_group?.trim()) {
            setError("Есть пустое поле, заполните, пожалуйста!");
            return false;
        }
        
        setError('');
        return true;
    }

  const saveNameGroup = async (groupId, name_group, event) => {
          event.preventDefault();

          if (!validateFormArray(groupId)) return;
          try {           
              setLoading(true);
              const response = await API.patch(
                  `/group_name_update/${groupId}`,
                  { name_group: name_group }
                  
                  );
              
              setError("")
              if (response.statusText==='OK') {                  
                  setGroups(prev => prev.map(item => 
                      item.id === groupId ? { ...item, isEditing: false } : item
                    ));
                  console.log("Update complete!")                
              } else {
                  const errorData = await response.data
                  console.log(errorData, 'тут ошибка')
              }
          } catch (error) {            
              console.log("Ошибка из бэка", error)
              setError('что-то пошло не так');            
          } finally {
            setLoading(false);
          }    
      };

  const cancelEditGroup = (groupId) => {
      const foundGroupLoad = groupsLoad.find(item => item.id === groupId);
      setGroups(prevGroups => 
        prevGroups.map(item => (
          item.id === groupId ?
          { ...item, isEditing: false, name_group: foundGroupLoad.name_group} 
          : item
          )));      
    }

  const handleRenameClick = (group) => {
      setGroups(prevGroups => 
        prevGroups.map(item => (
          item.id === group.id ? { ...item, isEditing: true} : item
          )));      
    }

  

  const handleCreateGroup = (newGroup) => {    
    console.log("Новая группа", newGroup)
    setGroups(prevGroups => [...prevGroups, newGroup]);
    setModalCreateGroup(false);
    };

  const openModalCreateGroup = () => {      
      setModalCreateGroup(true);
      };


  

  


  return (

    <>
      {/* Боковая панель с группами (постоянная) */}      
      <aside>
        
            <button className="save-button" onClick={openModalCreateGroup}>Добавить группу</button>

            <NavLink to="/knowledges/all" >              
                      <h2>Все группы</h2>
                    
            </NavLink>

            <br/>
      
            {
              groups.length === 0 ? (
                    <div className="name-knowledge">Список групп пуст</div>
                  ) : (groups?.map(group => (

                      group.isEditing ? (                      

                        <div className="list-group-edit section-frame">
                          <form onSubmit={(e) => saveNameGroup(group.id, group.name_group, e)} style={{ marginBottom: '1rem' }}>
                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <input 
                                placeholder="введите название"
                                name="name_group"
                                type="text"                        
                                value={group.name_group}
                                onChange={setGroupName(group.id)}
                                disabled={loading}
                              />

                              <div>
                                <button 
                                  className="accept-button" 
                                  type="submit" 
                                  disabled={loading}
                                >
                                  {loading ? '...' : ' '}
                                </button>
                                &nbsp;&nbsp;                                  

                                <button 
                                  onClick={(e) => { 
                                    e.preventDefault();
                                    cancelEditGroup(group.id); 
                                  }}
                                  className="close-button"
                                  disabled={loading}
                                >                
                                </button>
                              </div>
                            
                            </div>
                          {error && <p style={{ color: 'red'}}>{error}</p>}
                          </form>
                        </div>
                      

                    ) : ( 

                    <div>
                        <NavLink to={`/knowledges/${group.slug}`} className={setActive}>                              
                              {({ isActive }) => (
                                <div className={`list-group section-frame ${isActive ? "active" : ""}`}>
                                  <h2 className="name-knowledge">{group.name_group}</h2>                                  
                                    
                                  <DropdownMenu
                                    group={group}
                                    onDelete={handleDeleteClick}
                                    onRename={handleRenameClick}
                                  />


                                </div>                        
                              )}
                        </NavLink>
                        
                        <br/>
                    </div>
                    
                    )
                    ))              
              )
            }            

            {modalDeleteGroup && (
              <DeleteGroupModal
                groupToDelete={selectedGroup}
                onClose={() => setModalDeleteGroup(false)}
                onSuccess={handleDeleteSuccess}
              />
            )}        

      </aside>

      {/*центральная часть с кнопками*/}
      <div className="central-part">
          
      
      {modalCreateGroup && (
            <GroupCreateModal             
              onClose={() => setModalCreateGroup(false)}
              onSuccess={handleCreateGroup}
            />
          )}  

      

      
      {/* Основной контент (меняется) */}      
          <div>
            <Outlet />
          </div> 

      </div>

    </>
  );
}


async function getGroups() { 
  
  try {        
        const responseGroups = await API.get('/groups_all/');
        return responseGroups.data
      } catch (error) {
        console.log("Ошибка из лоадера", error.response?.data?.detail)

        return {"error": error.response?.data?.detail}
      }  
}




const KnowledgeGroupsLoader = async () => {

  const requestGroups = await getGroups()  

  return {
    groupsLoad: requestGroups    
  }
}




export { KnowledgeLayout, KnowledgeGroupsLoader }
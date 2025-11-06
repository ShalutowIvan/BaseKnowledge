import { NavLink, useLoaderData, Outlet, useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { API } from '../../apiAxios/apiAxios'
import { DeleteGroupModal } from './DeleteGroupModal'
import { GroupCreateModal } from './GroupCreateModal'
import { ActionsWithGroups } from './DropdownMenu'; 
import { ErrorDisplay } from './ErrorDisplay'

function KnowledgeLayout() {

  const setActive = ({isActive}) => isActive ? 'active-link' : '';  
  const [groups, setGroups] = useState([]);

  const { groupsLoad } = useLoaderData();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


  const [modalDeleteGroup, setModalDeleteGroup] = useState(false);
  const [modalCreateGroup, setModalCreateGroup] = useState(false);  
    
  const [selectedGroup, setSelectedGroup] = useState(null);
  
  const { slug_gr } = useParams(); 
  const navigate = useNavigate();
  

  //передаем объект группы в компонент модального окна и открываем его
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
        setLoading(true);
        setError(null);

        if (groupsLoad && typeof groupsLoad === 'object' && groupsLoad.error) {
          setError(groupsLoad.error);
          return;
        } 

        if (Array.isArray(groupsLoad)) {
          setGroups(groupsLoad.map(item => ({
            ...item,
            isEditing: false
          })));
        } else {
          setError("Неверный формат данных групп");
        }
      } catch (err) {
        setError(err?.message || "Ошибка загрузки групп");
        console.log("Error with load group in layout:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [groupsLoad]);

  
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
              setError(null);

              const groupToUpdate = groups.find(item => item.id === groupId);
              const oldSlug = groupToUpdate?.slug;

              const response = await API.patch(`/group_name_update/${groupId}`,
                  { name_group: name_group }                  
                  );
              
              if (response.status >= 200 && response.status < 300) {                  
                  const newSlug = response.data.slug
                  setError(null)
                  setGroups(prev => prev.map(item => 
                      item.id === groupId ? { ...item, slug: newSlug, isEditing: false } : item
                    ));
                  
                  if (slug_gr === oldSlug) {
                    navigate(`/knowledges/${newSlug}`, { replace: true })  
                  }                  
                  console.log("Rename group complete!")              
              }
          } catch (err) {            
              console.log("Error whith rename group:", err)
              setError(err.message);
          } finally {
            setLoading(false);
          }    
      };

  
  const cancelEditGroup = (groupId) => {
      const originalGroups = (Array.isArray(groupsLoad) && !groupsLoad.error) ? groupsLoad : [];
      const foundGroupLoad = originalGroups.find(item => item.id === groupId);
          
      setGroups(prevGroups => 
          prevGroups.map(item => 
            item.id === groupId 
              ? { ...item, isEditing: false, name_group: foundGroupLoad.name_group } 
              : item
          ));
    };


  const handleRenameClick = (group) => {
      setGroups(prevGroups => 
        prevGroups.map(item => (
          item.id === group.id ? { ...item, isEditing: true} : item
          )));      
    }
  

  const handleCreateGroup = (newGroup) => {    
    setGroups(prevGroups => [...prevGroups, newGroup]);
    setModalCreateGroup(false);
    };


  const openModalCreateGroup = () => {      
      setModalCreateGroup(true);
      };


  return (

    <>
      {/* Компонент для отображения ошибок */}
      <ErrorDisplay 
          error={error} 
          onClose={() => setError(null)} 
        />  
      
      {/* Боковая панель с группами (постоянная) */}      
      <aside>
            
            <h1>Группы</h1>
            
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

                        <div key={group.id} className="list-group-edit section-frame">
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
                                >                                               
                                </button>
                              </div>
                            
                            </div>
                          
                          </form>
                        </div>
                      

                    ) : ( 

                    <div key={group.id}>
                        <NavLink to={`/knowledges/${group.slug}`} className={setActive}>                              
                              {({ isActive }) => (
                                <div className={`list-group section-frame ${isActive ? "active" : ""}`}>
                                  <h2 className="name-knowledge">{group.name_group}</h2>
           
                                  <ActionsWithGroups
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
            

              


      </aside>

      {modalDeleteGroup && (
              <DeleteGroupModal
                groupToDelete={selectedGroup}
                onClose={() => setModalDeleteGroup(false)}
                onSuccess={handleDeleteSuccess}
              />
            )}    

      {/*центральная часть с кнопками*/}
      <div className="central-part-knowledges">
          
      
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
    return responseGroups.data;
  } catch (error) {
    console.log("Ошибка из лоадера", error);
    
    // ВОЗВРАЩАЕМ ОБЪЕКТ С ОШИБКОЙ
    return { 
      error: error.response?.data?.detail || error.message || "Ошибка соединения с сервером" 
    };
  }  
}

const KnowledgeGroupsLoader = async () => {
  const requestGroups = await getGroups();  
  return {
    groupsLoad: requestGroups    
  };
};



export { KnowledgeLayout, KnowledgeGroupsLoader }
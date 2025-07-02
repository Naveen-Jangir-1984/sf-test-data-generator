import Cards from "./Cards";
import Search from "./Search";

interface ListProps {
  users: { Id: string; Name: string }[];
  type: string;
  loading: boolean;
  data: { [key: string]: any }[];
  editingId: string | null;
  mandatoryKeys: string[];
  editFields: { [key: string]: any };
  editExtraFields: { [key: string]: { key: string; value: string }[] };
  searchText: string;
  setSearchText: (text: string) => void;
  handleEditChange: (key: string, value: string) => void;
  setEditFields: (fields: { [key: string]: any }) => void;
  handleEditExtraFieldChange: (id: string, idx: number, key: string, value: string) => void;
  handleRemoveEditExtraField: (id: string, idx: number) => void;
  handleAddEditField: (id: string) => void;
  handleUpdate: () => void;
  handleCancel: () => void;
  handleViewObject: (id: string) => void;
  startEditing: (item: any) => void;
  handleDeleteObject: (id: string) => void;
}

const List: React.FC<ListProps> = ({ 
    users, 
    type, 
    loading, 
    data, 
    editingId, 
    mandatoryKeys, 
    editFields, 
    editExtraFields, 
    searchText, 
    setSearchText, 
    handleEditChange, 
    setEditFields,
    handleEditExtraFieldChange, 
    handleRemoveEditExtraField,
    handleAddEditField,
    handleUpdate,
    handleCancel,
    handleViewObject,
    startEditing,
    handleDeleteObject
  }) => {
  return (

    <div className='list'>
      <h2>{`${type.charAt(0).toUpperCase()}${type.substring(1, type.length)}`}</h2>
      {loading ? <div>{`Fetching ${type}...`}</div> : data.length ?
      <div className='cards'>
        <Search type={type} searchText={searchText} setSearchText={setSearchText} />
        <Cards 
          users={users}
          loading={loading} 
          data={data} 
          editingId={editingId}
          mandatoryKeys={mandatoryKeys}
          editFields={editFields}
          editExtraFields={editExtraFields}
          searchText={searchText}
          handleEditChange={handleEditChange}
          setEditFields={setEditFields}
          handleEditExtraFieldChange={handleEditExtraFieldChange}
          handleRemoveEditExtraField={handleRemoveEditExtraField}
          handleAddEditField={handleAddEditField}
          handleUpdate={handleUpdate}
          handleCancel={handleCancel}
          handleViewObject={handleViewObject}
          startEditing={startEditing}
          handleDeleteObject={handleDeleteObject}
        />
      </div> : <div>{`No ${type} available !`}</div>
      }
    </div>
    )
};

export default List;
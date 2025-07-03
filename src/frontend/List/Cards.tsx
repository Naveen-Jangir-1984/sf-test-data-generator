import Card from "./Card";

interface CardsProps {
  users: { Id: string; Name: string }[];
  loading: boolean;
  data: { [key: string]: any }[];
  editingId: string | null;
  mandatoryKeys: string[];
  editFields: { [key: string]: any };
  editExtraFields: { [key: string]: { key: string; value: string }[] };
  searchText: string;
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

const Cards: React.FC<CardsProps> = ({ 
    users,
    data, 
    editingId, 
    mandatoryKeys, 
    editFields, 
    editExtraFields, 
    searchText,
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
  return (<>
    {data.filter(item =>
        Object.values(item).some(val =>
          String(val).toLowerCase().includes(searchText.toLowerCase())
        )
      )
      .map((item) => <Card
        key={item.Id}
        item={item}
        users={users}
        editingId={editingId}
        mandatoryKeys={mandatoryKeys}
        editFields={editFields}
        editExtraFields={editExtraFields}
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
      />)}
  </>)
};

export default Cards;
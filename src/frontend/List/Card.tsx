interface CardProps {
  item: { [key: string]: any };
  users: { Id: string; Name: string }[];
  editingId: string | null;
  mandatoryKeys: string[];
  editFields: { [key: string]: any };
  editExtraFields: { [key: string]: { key: string; value: string }[] };
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

const Card: React.FC<CardProps> = ({ 
    item,
    users,
    editingId, 
    mandatoryKeys, 
    editFields, 
    editExtraFields,
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
    <div key={item.Id} className='card'>
      <>
        {editingId === item.Id
          ? Object.entries(editFields).map(([key, value]) => (
              <div key={key} className='attributes'>
                <span style={{ fontSize: 'small', fontWeight: 'bolder' }}>{key === 'OwnerId' ? 'Owner' : key}</span>
                {
                  key === 'OwnerId' ?
                  <select value={value} onChange={(e) => handleEditChange(key, e.target.value)}>
                    <option value=''>-- Owner --</option>
                    { users.map(u => <option key={u.Id} value={u.Id}>{u.Name}</option>) }
                  </select> :
                  <input
                    disabled={key === 'Id'}
                    value={value}
                    onChange={(e) => handleEditChange(key, e.target.value)}
                  />
                }
                {!mandatoryKeys.includes(key) && key !== 'Id' && (
                  <button
                    onClick={() => {
                      const updated = { ...editFields };
                      delete updated[key];
                      setEditFields(updated);
                    }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))
          : Object.entries(item).map(([key, value]) => (
              <div key={key} className='attributes'>
                <span style={{ fontSize: 'small', fontWeight: 'bolder' }}>{key === 'OwnerId' ? 'Owner' : key}</span>
                {
                  key === 'OwnerId' ?
                  <select value={value || ''} disabled>
                    <option value=''>-- Owner --</option>
                    { users.map(u => <option key={u.Id} value={u.Id}>{u.Name}</option>) }
                  </select> : 
                  <input disabled value={value || ''} />
                }
              </div>
            ))}
            {editingId === item.Id && (editExtraFields[item.Id] || []).map((field, idx) => (
              <div key={`extra-${idx}`} className='attributes'>
                <input
                  placeholder="Field name"
                  value={field.key}
                  onChange={(e) =>
                    handleEditExtraFieldChange(item.Id, idx, e.target.value, field.value)
                  }
                />
                <input
                  placeholder="Field value"
                  value={field.value}
                  onChange={(e) =>
                    handleEditExtraFieldChange(item.Id, idx, field.key, e.target.value)
                  }
                />
                <button onClick={() => handleRemoveEditExtraField(item.Id, idx)}>Remove</button>
              </div>
            ))}
        {editingId === item.Id ? (<div className='actions'>
            <button onClick={() => handleAddEditField(item.Id)}>+ Field</button>
            <button onClick={handleUpdate}>Update</button>
            <button onClick={handleCancel}>Cancel</button>
            </div>
          ) : ( <div className='actions'>
            <button onClick={() => handleViewObject(item.Id)}>View</button>
            <button onClick={() => startEditing(item)}>Edit</button>
            <button onClick={() => handleDeleteObject(item.Id)}>Delete</button>
            </div>
          )}
      </>
    </div>
    )
};

export default Card;
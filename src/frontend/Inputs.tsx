type ObjectType = 'leads' | 'accounts' | 'opportunities';

interface InputsProps {
  user: string;
  users: { Id: string; Name: string }[];
  type: string;
  formFields: { key: string; value: string }[];
  mandatoryKeys: string[];
  setUser: (user: string) => void;
  setType: (type: ObjectType) => void;
  handleFieldChange: (index: number, key: string, value: string) => void;
  handleRemoveField: (index: number) => void;
  handleAddField: () => void;
  handleAddObject: () => void;
}

const Inputs: React.FC<InputsProps> = ({ 
    user, 
    users, 
    type, 
    formFields, 
    mandatoryKeys, 
    setUser, 
    setType, 
    handleFieldChange, 
    handleRemoveField,
    handleAddField,
    handleAddObject
  }) => {
  return (
    <div className='inputs'>
      <h2>Test Data Generator</h2>
      <div className='objects'>
        <div style={{fontWeight: 'bolder'}}>Select an Object</div>
        <select value={type} onChange={(e) => setType(e.target.value as ObjectType)}>
          <option value="leads">Leads</option>
          <option value="accounts">Accounts</option>
          <option value="opportunities">Opportunities</option>
        </select>
      </div>

      <h3>{`Add New ${type.charAt(0).toUpperCase()}${type.substring(1, type.length)}`}</h3>
      {formFields.map((field, index) => (
        <div key={index} className='fields'>
          <input
            placeholder="Field name"
            value={field.key === 'OwnerId' ? 'Owner' : field.key}
            onChange={(e) => handleFieldChange(index, e.target.value, field.value)}
            disabled={mandatoryKeys.includes(field.key)} // prevent editing mandatory keys
          />
          {
            field.key === 'OwnerId' ?
            <select value={user} onChange={(e) => setUser(e.target.value)}>
              <option value=''>-- Owner --</option>
              { users.map(u => <option key={u.Id} value={u.Id}>{u.Name}</option>) }
            </select> : 
            <input
              placeholder="Field value"
              value={field.value}
              onChange={(e) => handleFieldChange(index, field.key, e.target.value)}
            />
          }
          {!mandatoryKeys.includes(field.key) && (
            <button onClick={() => handleRemoveField(index)}>Remove</button>
          )}
        </div>
      ))}

      <div className='actions'>
        <button onClick={handleAddField}>+ Field</button>
        <button onClick={handleAddObject} disabled={user === ''}>Submit</button>
      </div>
    </div>
    )
};

export default Inputs;
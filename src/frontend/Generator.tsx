import React, { useEffect, useState } from 'react';
import axios from 'axios';

type ObjectType = 'leads' | 'accounts' | 'opportunities';

interface SalesforceObject {
  Id: string;
  [key: string]: any;
}

const defaultFields: Record<ObjectType, { key: string; value: string }[]> = {
  leads: [
    { key: 'LastName', value: 'Default LastName' },
    { key: 'Company', value: 'Default Company' },
    { key: 'Status', value: 'Open - Not Contacted' },
    { key: 'OwnerId', value: '' },
  ],
  accounts: [
    { key: 'Name', value: 'Default Account Name' },
    { key: 'OwnerId', value: '' },
  ],
  opportunities: [
    { key: 'Name', value: 'Default Opportunity' },
    { key: 'StageName', value: 'Prospecting' },
    { key: 'CloseDate', value: new Date().toISOString().split('T')[0] },
    { key: 'OwnerId', value: '' },
  ]
};

const Generator: React.FC = () => {
  const [type, setType] = useState<ObjectType>('leads');
  const [data, setData] = useState<SalesforceObject[]>([]);
  const [user, setUser] = useState<string>('');
  const [users, setUsers] = useState<{ Id: string; Name: string }[]>([]);
  const [formFields, setFormFields] = useState<{ key: string; value: string }[]>([]);
  const [searchText, setSearchText] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<{ [key: string]: string }>({});

  const [editExtraFields, setEditExtraFields] = useState<{ [id: string]: { key: string; value: string }[] }>({});
  const [viewingItem, setViewingItem] = useState<SalesforceObject | null>(null);

  const [loading, setLoading] = useState(false);

  const mandatoryKeys = defaultFields[type].map(field => field.key);

  const fetchData = async () => {
    const res = await axios.get(`${process.env.REACT_APP_API}/${type}`);
    setData(res.data);
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API}/users`);
      setUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  useEffect(() => {
    setLoading(true);
    try {
      fetchUsers();
      fetchData();
      setFormFields(defaultFields[type]);
    } finally {
    }
  }, [type]);

  const handleAddField = () => {
    setFormFields([...formFields, { key: '', value: '' }]);
  };

  const handleFieldChange = (index: number, key: string, value: string) => {
    const updated = [...formFields];
    updated[index] = { key, value };
    setFormFields(updated);
  };

  const handleAddObject = async () => {
    setLoading(true);
    try {
      const payload: any = {};
      formFields.forEach(({ key, value }) => {
        if (key) payload[key] = value;
      });
      await axios.post(`${process.env.REACT_APP_API}/${type}`, { ...payload, "OwnerId": user });
      // alert(`${type.substring(0, type.length - 1)} has been added !`);
      setFormFields(defaultFields[type]);
      fetchData();
    } finally {
    }
  };
  
  const handleAddEditField = (id: string) => {
    setEditExtraFields(prev => ({
      ...prev,
      [id]: [...(prev[id] || []), { key: '', value: '' }]
    }));
  };
  
  const handleEditExtraFieldChange = (id: string, index: number, key: string, value: string) => {
    const updated = [...(editExtraFields[id] || [])];
    updated[index] = { key, value };
    setEditExtraFields(prev => ({ ...prev, [id]: updated }));
  };  

  // const handleDeleteField = async (Id: string, field: string) => {
  //   await axios.patch(`${process.env.REACT_APP_API}/${type}/${Id}/remove-field`, { field });
  //   fetchData();
  // };

  const handleDeleteObject = async (Id: string) => {
    setLoading(true);
    try {
      await axios.delete(`${process.env.REACT_APP_API}/${type}/${Id}`);
      // alert(`${type.substring(0, type.length - 1)} has been deleted !`);
      setFormFields(defaultFields[type]);
      fetchData();
    } finally {
    }
  };

  const startEditing = (item: SalesforceObject) => {
    setEditingId(item.Id);
    setEditFields({ ...item });
  
    if (!editExtraFields[item.Id]) {
      setEditExtraFields(prev => ({ ...prev, [item.Id]: [] }));
    }
  };  

  const handleEditChange = (key: string, value: string) => {
    setEditFields({ ...editFields, [key]: value });
  };
  
  const handleUpdate = async () => {
    setLoading(true);
    try {
      const extra = editExtraFields[editingId || ''] || [];
      const payload: any = { ...editFields };
  
      // Add extra fields
      extra.forEach(({ key, value }) => {
        if (key) payload[key] = value;
      });
  
      // Find original object
      const original = data.find(obj => obj.Id === editingId);
      if (original) {
        Object.keys(original).forEach((key) => {
          if (key !== 'Id' && !(key in payload)) {
            // Field was removed — set to null (or '' if preferred)
            payload[key] = null; // or '' if backend expects empty string
          }
        });
      }
  
      await axios.put(`${process.env.REACT_APP_API}/${type}/${editingId}`, payload);
  
      setEditingId(null);
      setEditFields({});
      setEditExtraFields(prev => {
        const copy = { ...prev };
        delete copy[editingId || ''];
        return copy;
      });
      fetchData();
    } finally {
    }
  };  

  const handleCancel = async () => {
    setEditingId(null);
    setEditFields({});
    setEditExtraFields(prev => {
      const copy = { ...prev };
      if (editingId) delete copy[editingId];
      return copy;
    });
  };  

  const handleRemoveField = (index: number) => {
    const updated = [...formFields];
    updated.splice(index, 1);
    setFormFields(updated);
  };  

  const handleRemoveEditExtraField = (id: string, index: number) => {
    const updated = [...(editExtraFields[id] || [])];
    updated.splice(index, 1);
    setEditExtraFields(prev => ({ ...prev, [id]: updated }));
  };  

  const handleViewObject = async (id: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API}/${type}/${id}/full`);
      setViewingItem(res.data);
    } catch (err) {
      alert('Failed to fetch full object');
    } finally {
      setLoading(false);
    }
  };  

  return (
    <div className='generator'>
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

      <div className='list'>
        <h2>{`${type.charAt(0).toUpperCase()}${type.substring(1, type.length)}`}</h2>
        {loading ? <div>{`Fetching ${type}...`}</div> : data.length ?
        <div className='cards'>
          <input
            type="text"
            placeholder={`Search ${type}...`}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ marginBottom: '10px', padding: '5px', width: '100%' }}
          />
          {data.filter(item =>
            Object.values(item).some(val =>
              String(val).toLowerCase().includes(searchText.toLowerCase())
            )
          )
          .map((item) => (
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
          ))}
        </div> : <div>{`No ${type} available !`}</div>
        }
      </div>

      {viewingItem && (
        <div className="modal">
          <div className="modal-content">
            {Object.entries(viewingItem).map(([key, value]) => (
              <div key={key} className='attributes'>
                <strong>{key}</strong>
                {key === 'attributes' && typeof value === 'object' && value !== null ? (
                  <div style={{ marginLeft: '10px' }}>
                    {Object.entries(value).map(([subKey, subVal]) => (
                      <div key={subKey}>
                        <em>{subKey}</em>: {String(subVal)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span> {String(value)}</span>
                )}
              </div>
            ))}
            <button onClick={() => setViewingItem(null)}>Close</button>
          </div>
        </div>
      )}

      {loading && (
      <div className="loading-overlay">
        <div className="spinner" />
        <p>Please wait...</p>
      </div>
      )}
    </div>
  );
};

export default Generator;
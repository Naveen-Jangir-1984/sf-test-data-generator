import React, { useEffect, useState } from 'react';
import axios from 'axios';

type ObjectType = 'leads' | 'accounts' | 'opportunities';

interface SalesforceObject {
  id: string;
  [key: string]: any;
}

const defaultFields: Record<ObjectType, { key: string; value: string }[]> = {
  leads: [
    { key: 'LastName', value: 'Default LastName' },
    { key: 'Company', value: 'Default Company' },
    { key: 'Status', value: 'Open - Not Contacted' }
  ],
  accounts: [
    { key: 'Name', value: 'Default Account Name' }
  ],
  opportunities: [
    { key: 'Name', value: 'Default Opportunity' },
    { key: 'StageName', value: 'Prospecting' },
    { key: 'CloseDate', value: new Date().toISOString().split('T')[0] }
  ]
};

const Generator: React.FC = () => {
  const [type, setType] = useState<ObjectType>('leads');
  const [data, setData] = useState<SalesforceObject[]>([]);
  const [formFields, setFormFields] = useState<{ key: string; value: string }[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<{ [key: string]: string }>({});

  const [loading, setLoading] = useState(false);

  const mandatoryKeys = defaultFields[type].map(field => field.key);

  const fetchData = async () => {
    const res = await axios.get(`${process.env.REACT_APP_API}/${type}`);
    setData(res.data);
  };

  useEffect(() => {
    setLoading(true);
    try {
      fetchData();
      setFormFields(defaultFields[type]);
    } finally {
      setLoading(false);
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
      await axios.post(`${process.env.REACT_APP_API}/${type}`, payload);
      // alert(`${type.substring(0, type.length - 1)} has been added !`);
      setFormFields(defaultFields[type]);
      fetchData();
    } finally {
      setLoading(false);
    }
  };

  // const handleDeleteField = async (id: string, field: string) => {
  //   await axios.patch(`${process.env.REACT_APP_API}/${type}/${id}/remove-field`, { field });
  //   fetchData();
  // };

  const handleDeleteObject = async (id: string) => {
    setLoading(true);
    try {
      await axios.delete(`${process.env.REACT_APP_API}/${type}/${id}`);
      // alert(`${type.substring(0, type.length - 1)} has been deleted !`);
      setFormFields(defaultFields[type]);
      fetchData();
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (item: SalesforceObject) => {
    setEditingId(item.id);
    setEditFields({ ...item });
  };

  const handleEditChange = (key: string, value: string) => {
    setEditFields({ ...editFields, [key]: value });
  };
  
  const handleUpdate = async () => {
    setLoading(true);
    try {
      await axios.put(`${process.env.REACT_APP_API}/${type}/${editingId}`, editFields);
      // alert(`${type.substring(0, type.length - 1)} has been updated !`);
      setEditingId(null);
      setEditFields({});
      fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setEditingId(null);    
  };

  const handleRemoveField = (index: number) => {
    const updated = [...formFields];
    updated.splice(index, 1);
    setFormFields(updated);
  };  

  return (
    <div className='generator'>
      <h2 style={{margin: '50px 0'}}>Test Data Generator</h2>
      <div className='objects'>
        <div style={{fontWeight: 'bolder'}}>Select an Object{' '}</div>
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
            value={field.key}
            onChange={(e) => handleFieldChange(index, e.target.value, field.value)}
            disabled={mandatoryKeys.includes(field.key)} // prevent editing mandatory keys
          />
          <input
            placeholder="Field value"
            value={field.value}
            onChange={(e) => handleFieldChange(index, field.key, e.target.value)}
          />
          {!mandatoryKeys.includes(field.key) && (
            <button onClick={() => handleRemoveField(index)}>Remove</button>
          )}
        </div>
      ))}

      <div className='actions'>
        <button onClick={handleAddField}>+ Field</button>
        <button onClick={handleAddObject}>Submit</button>
      </div>

      <h3>{`${type.charAt(0).toUpperCase()}${type.substring(1, type.length)}`}</h3>
      <div className='cards'>
        {data.map((item) => (
          <div key={item.id} className='card'>
            <div>
              <div><strong>Id: </strong>{item.id}</div>
              {Object.entries(item).map(([key, value]) =>
                key !== 'id' ? (
                  <div key={key}>
                    <strong>{key}:{' '}</strong>
                    {editingId === item.id ? (
                      <input
                        value={editFields[key] || ''}
                        onChange={(e) => handleEditChange(key, e.target.value)}
                      />
                    ) : (
                      value
                    )}
                    {/* {editingId === item.id && (
                      <button onClick={() => handleDeleteField(item.id, key)}>Delete Field</button>
                    )} */}
                  </div>
                ) : null
              )}
              {editingId === item.id ? (<div className='actions'>
                  <button onClick={handleUpdate}>Update</button>
                  <button onClick={handleCancel}>Cancel</button>
                  </div>
                ) : ( <div className='actions'>
                  <button onClick={() => startEditing(item)}>Edit</button>
                  <button onClick={() => handleDeleteObject(item.id)}>Delete</button>
                  </div>
                )}
            </div>
          </div>
        ))}
      </div>

      {loading && (
      <div className="loading-overlay">
        <div className="spinner" />
        <p>Processing...</p>
      </div>
      )}
    </div>
  );
};

export default Generator;
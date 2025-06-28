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

const SalesforceManager: React.FC = () => {
  const [type, setType] = useState<ObjectType>('leads');
  const [data, setData] = useState<SalesforceObject[]>([]);
  const [formFields, setFormFields] = useState<{ key: string; value: string }[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<{ [key: string]: string }>({});

  const mandatoryKeys = defaultFields[type].map(field => field.key);

  const fetchData = async () => {
    const res = await axios.get(`http://localhost:5000/api/salesforce/${type}`);
    setData(res.data);
  };

  useEffect(() => {
    fetchData();
    setFormFields(defaultFields[type]);
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
    const payload: any = {};
    formFields.forEach(({ key, value }) => {
      if (key) payload[key] = value;
    });
    await axios.post(`http://localhost:5000/api/salesforce/${type}`, payload);
    alert(`${type.substring(0, type.length - 1)} has been added !`);
    setFormFields(defaultFields[type]);
    fetchData();
  };

  const handleDeleteField = async (id: string, field: string) => {
    await axios.patch(`http://localhost:5000/api/salesforce/${type}/${id}/remove-field`, { field });
    fetchData();
  };

  const handleDeleteObject = async (id: string) => {
    await axios.delete(`http://localhost:5000/api/salesforce/${type}/${id}`);
    alert(`${type.substring(0, type.length - 1)} has been deleted !`);
    setFormFields(defaultFields[type]);
    fetchData();
  };

  const startEditing = (item: SalesforceObject) => {
    setEditingId(item.id);
    setEditFields({ ...item });
  };

  const handleEditChange = (key: string, value: string) => {
    setEditFields({ ...editFields, [key]: value });
  };
  
  const handleUpdate = async () => {
    await axios.put(`http://localhost:5000/api/salesforce/${type}/${editingId}`, editFields);
    alert(`${type.substring(0, type.length - 1)} has been updated !`);
    setEditingId(null);
    setEditFields({});
    fetchData();
  };

  const handleRemoveField = (index: number) => {
    const updated = [...formFields];
    updated.splice(index, 1);
    setFormFields(updated);
  };  

  return (
    <div>
      <h2>Salesforce Test Data Manager</h2>
      <select value={type} onChange={(e) => setType(e.target.value as ObjectType)}>
        <option value="leads">Leads</option>
        <option value="accounts">Accounts</option>
        <option value="opportunities">Opportunities</option>
      </select>

      <h3>Add New {type}</h3>
      {formFields.map((field, index) => (
        <div key={index}>
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

      <button onClick={handleAddField}>Add Field</button>
      <button onClick={handleAddObject}>Submit</button>

      <h3>{type} List</h3>
      <ul>
        {data.map((item) => (
          <li key={item.id}>
            {/* <strong>ID:</strong> {item.id} */}
            <ul>
              {Object.entries(item).map(([key, value]) =>
                key !== 'id' ? (
                  <li key={key}>
                    <strong>{key}:</strong>
                    {editingId === item.id ? (
                      <input
                        value={editFields[key] || ''}
                        onChange={(e) => handleEditChange(key, e.target.value)}
                      />
                    ) : (
                      value
                    )}
                    {editingId === item.id && (
                      <button onClick={() => handleDeleteField(item.id, key)}>Delete Field</button>
                    )}
                  </li>
                ) : null
              )}
              {editingId === item.id ? (
                  <button onClick={handleUpdate}>Save</button>
                ) : (
                  <button onClick={() => startEditing(item)}>Edit</button>
                )}
            </ul>
            <button onClick={() => handleDeleteObject(item.id)}>Delete Object</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SalesforceManager;
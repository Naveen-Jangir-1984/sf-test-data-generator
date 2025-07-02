import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Loading from './Loading';
import View from './View';
import List from './List/List';
import Inputs from './Inputs';

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
      setUser('');
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
      setUser('');
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
      setUser('');
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
      <Inputs
        user={user}
        users={users} 
        type={type}
        formFields={formFields} 
        mandatoryKeys={mandatoryKeys} 
        setUser={setUser} 
        setType={setType} 
        handleFieldChange={handleFieldChange} 
        handleRemoveField={handleRemoveField}
        handleAddField={handleAddField}
        handleAddObject={handleAddObject}
      />
      
      <List 
        users={users} 
        type={type} 
        loading={loading} 
        data={data} 
        editingId={editingId}
        mandatoryKeys={mandatoryKeys}
        editFields={editFields}
        editExtraFields={editExtraFields}
        searchText={searchText}
        setSearchText={setSearchText}
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

      {viewingItem && <View viewingItem={viewingItem} setViewingItem={setViewingItem} />}

      {loading && <Loading />}
    </div>
  );
};

export default Generator;
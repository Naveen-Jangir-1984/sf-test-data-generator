import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import jsforce from 'jsforce';
import dotenv from 'dotenv';
dotenv.config();

const URL = process.env.REACT_APP_URL || '';
const USERNAME = process.env.REACT_APP_USERNAME || '';
const PASSWORD = `${process.env.REACT_APP_PASSWORD}${process.env.REACT_APP_TOKEN}` || '';

const defaultFields: Record<string, Record<string, any>> = {
  leads: {
    LastName: '',
    Company: '',
    Status: ''
  },
  accounts: {
    Name: ''
  },
  opportunities: {
    Name: '',
    StageName: '',
    CloseDate: new Date().toISOString().split('T')[0] // today's date
  }
};

const router = Router();
const filePath = path.join(__dirname, '../data/salesforce.json');

const readData = () => JSON.parse(fs.readFileSync(filePath, 'utf-8'));
const writeData = (data: any) => fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

const sfObjectMap: Record<string, string> = {
  leads: 'Lead',
  accounts: 'Account',
  opportunities: 'Opportunity'
};


router.get('/users', async (req, res) => {
  try {
    const conn = new jsforce.Connection({ loginUrl: URL });
    await conn.login(USERNAME, PASSWORD);

    const sfUsers = await conn.query(
      "SELECT Id, Name, Username FROM User WHERE IsActive = true ORDER BY Name"
    );
    const liveUsers = sfUsers.records;

    // Read salesforce.json and filter "users" based on Salesforce Names
    const data = readData();
    const localUsers = new Set((data.users || []).map((user: any) => user.Username));

    const matchedUsers = liveUsers.filter((user: any) => localUsers.has(user.Username));
    const filteredUsers = matchedUsers.map(user => {
      const { attributes, ...rest } = user;
      return rest;
    });
    data.users = filteredUsers;

    // Save updated data
    writeData(data);

    // Return fresh Salesforce users (or matched only if needed)
    res.json(filteredUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all objects of a type
router.get('/:type', async (req, res) => {
  const conn = new jsforce.Connection({ loginUrl: URL });
  const type = req.params.type;

  try {
    await conn.login(USERNAME, PASSWORD);

    const sfObjectName = sfObjectMap[type];
    if (!sfObjectName) return res.status(400).send('Invalid object type');

    // Fetch Salesforce records
    const sfRecords = await conn.sobject(sfObjectName).find({}, 'Id').limit(200).execute();
    const sfIdSet = new Set(sfRecords.map((record: any) => record.Id));

    // Read local data
    const allLocalData = readData();
    const localRecords = allLocalData[type] || [];

    // Keep only matching records
    const matched = localRecords.filter((record: any) => sfIdSet.has(record.Id));

    // Update JSON file
    allLocalData[type] = matched;
    writeData(allLocalData);

    res.json(matched);
  } catch (error) {
    console.error('Salesforce error:', error);
    res.status(500).send('Failed to fetch/compare Salesforce objects');
  }
});

// Get full object record from Salesforce
router.get('/:type/:Id/full', async (req, res) => {
  const conn = new jsforce.Connection({ loginUrl: URL });

  try {
    await conn.login(USERNAME, PASSWORD);

    const objectType = req.params.type;
    const recordId = req.params.Id;

    const sfObjectName = sfObjectMap[objectType];
    if (!sfObjectName) return res.status(400).send('Invalid object type');

    // Fetch full object
    const fullObject = await conn.sobject(sfObjectName).retrieve(recordId);
    res.json(fullObject);

  } catch (error) {
    console.error('Error fetching full object:', error);
    res.status(500).send('Failed to fetch full object');
  }
});

// Add new object with dynamic fields
router.post('/:type', async (req, res) => {
  const conn = new jsforce.Connection({
    loginUrl: URL
  });
  try {
    await conn.login(USERNAME, PASSWORD);

    const objectType = req.params.type;
    const payload = req.body;

    const sfObjectName = sfObjectMap[objectType];
    if (!sfObjectName) return res.status(400).send('Invalid object type');

    const result: any = await conn.sobject(sfObjectName).create(payload);
    if (!result.success) {
      return res.status(500).send('Failed to update Salesforce object');
    }

    // Save locally as well
    const data = readData();
    const newItem = { Id: result.id, ...payload };
    data[objectType] = data[objectType] || [];
    data[objectType].push(newItem);
    writeData(data);
    
    res.status(201).json({ Id: result.id, ...req.body });

  } catch (error) {
    console.error('Salesforce error:', error);
    res.status(500).send('Failed to create Salesforce object');
  }
});

// Update object
router.put('/:type/:Id', async (req, res) => {
  const conn = new jsforce.Connection({
    loginUrl: URL
  });
  try {
    await conn.login(USERNAME, PASSWORD);

    const objectType = req.params.type;
    const recordId = req.params.Id;
    const { Id, id, ...updateFields } = req.body;

    const sfObjectName = sfObjectMap[objectType];
    if (!sfObjectName) return res.status(400).send('Invalid object type');

    // Update in Salesforce
    const result: any = await conn.sobject(sfObjectName).update({ Id: recordId, ...updateFields });
    if (!result.success) {
      return res.status(500).send('Failed to update Salesforce object');
    }

    // Update in local JSON
    const data = readData();
    const items = data[objectType] || [];
    const index = items.findIndex((item: any) => item.Id === recordId);
    if (index === -1) return res.status(404).send('Object not found locally');

    for (const key in updateFields) {
      if (updateFields[key] === null || updateFields[key] === '') {
        delete items[index][key]; // remove the key from local copy
      } else {
        items[index][key] = updateFields[key]; // update normally
      }
    }    
    writeData(data);
    
    res.json({ Id: req.params.Id, ...updateFields });

  } catch (error) {
    console.error('Salesforce update error:', error);
    res.status(500).send('Error updating Salesforce object');
  }
});

// Delete object
router.delete('/:type/:Id', async (req, res) => {
  const conn = new jsforce.Connection({
    loginUrl: URL
  });
  try {
    await conn.login(USERNAME, PASSWORD);

    const objectType = req.params.type;
    const recordId = req.params.Id;

    const sfObjectName = sfObjectMap[objectType];
    if (!sfObjectName) return res.status(400).send('Invalid object type');

    // Delete from Salesforce
    const result: any = await conn.sobject(sfObjectName).delete(recordId);
    if (!result.success) {
      return res.status(500).send('Failed to delete from Salesforce');
    }

    // Delete from local JSON
    const data = readData();
    data[objectType] = (data[objectType] || []).filter((item: any) => item.Id !== recordId);
    writeData(data);

    res.status(204).send();

  } catch (error) {
    console.error('Salesforce delete error:', error);
    res.status(500).send('Error deleting Salesforce object');
  }
});

// Delete a field from an object
router.patch('/:type/:Id/remove-field', async (req, res) => {
  const conn = new jsforce.Connection({
    loginUrl: URL
  });
  try {
    await conn.login(USERNAME, PASSWORD);

    const objectType = req.params.type;
    const recordId = req.params.Id;
    const { field } = req.body;
    const sfObjectName = sfObjectMap[objectType];

    const record = await conn.sobject(sfObjectName).retrieve(req.params.Id);
    delete record[field];
    await conn.sobject(sfObjectName).update({ Id: req.params.Id, ...record });
    res.json(record);
  } catch (error) {
    console.error('Salesforce delete error:', error);
    res.status(500).send('Error deleting Salesforce object');
  }
});

export default router;

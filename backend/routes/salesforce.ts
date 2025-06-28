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

// Get all objects of a type
router.get('/:type', (req, res) => {
  const data = readData();
  res.json(data[req.params.type] || []);
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

    // Save locally as well
    const data = readData();
    const newItem = { id: result.id, ...payload };
    data[objectType] = data[objectType] || [];
    data[objectType].push(newItem);
    writeData(data);

    res.status(201).json(newItem);
  } catch (error) {
    console.error('Salesforce error:', error);
    res.status(500).send('Failed to create Salesforce object');
  }
});

// Update object
router.put('/:type/:id', async (req, res) => {
  const conn = new jsforce.Connection({
    loginUrl: URL
  });
  try {
    await conn.login(USERNAME, PASSWORD);

    const objectType = req.params.type;
    const recordId = req.params.id;
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
    const index = items.findIndex((item: any) => item.id === recordId);
    if (index === -1) return res.status(404).send('Object not found locally');

    items[index] = { ...items[index], ...updateFields };
    writeData(data);

    res.json(items[index]);
  } catch (error) {
    console.error('Salesforce update error:', error);
    res.status(500).send('Error updating Salesforce object');
  }
});

// Delete object
router.delete('/:type/:id', async (req, res) => {
  const conn = new jsforce.Connection({
    loginUrl: URL
  });
  try {
    await conn.login(USERNAME, PASSWORD);

    const objectType = req.params.type;
    const recordId = req.params.id;

    const sfObjectName = sfObjectMap[objectType];
    if (!sfObjectName) return res.status(400).send('Invalid object type');

    // Delete from Salesforce
    const result: any = await conn.sobject(sfObjectName).delete(recordId);
    if (!result.success) {
      return res.status(500).send('Failed to delete from Salesforce');
    }

    // Delete from local JSON
    const data = readData();
    data[objectType] = (data[objectType] || []).filter((item: any) => item.id !== recordId);
    writeData(data);

    res.status(204).send();
  } catch (error) {
    console.error('Salesforce delete error:', error);
    res.status(500).send('Error deleting Salesforce object');
  }
});

// Delete a field from an object
router.patch('/:type/:id/remove-field', (req, res) => {
  const { field } = req.body;
  const data = readData();
  const items = data[req.params.type] || [];
  const index = items.findIndex((item: any) => item.id === req.params.id);
  if (index === -1) return res.status(404).send('Not found');
  delete items[index][field];
  writeData(data);
  res.json(items[index]);
});

export default router;

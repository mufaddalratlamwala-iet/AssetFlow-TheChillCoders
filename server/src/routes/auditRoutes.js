const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Only Asset Manager or Admin can create/close cycles and get reports
router.post('/audit-cycles', auth, roleCheck(['Enterprise Admin', 'Asset Manager']), auditController.createAuditCycle);
router.post('/audit-cycles/:id/auditors', auth, roleCheck(['Enterprise Admin', 'Asset Manager']), auditController.addAuditors);
router.post('/audit-cycles/:id/close', auth, roleCheck(['Enterprise Admin', 'Asset Manager']), auditController.closeAuditCycle);
router.get('/audit-cycles/:id/discrepancy-report', auth, roleCheck(['Enterprise Admin', 'Asset Manager', 'Department Head']), auditController.getDiscrepancyReport);

// Get all audit cycles (accessible to anyone, though employees usually only see ones they are assigned to)
router.get('/audit-cycles', auth, auditController.getAuditCycles);

// Any authenticated user can potentially submit an audit item if they are assigned as an auditor
router.post('/audit-items', auth, auditController.addAuditItem);

module.exports = router;

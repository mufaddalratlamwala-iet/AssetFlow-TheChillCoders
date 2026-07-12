const scopeToDepartment = (getResourceDeptId) => async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (req.user.role === 'Admin' || req.user.role === 'Asset Manager') {
    return next();
  }
  
  if (req.user.role === 'Department Head') {
    try {
      const resourceDeptId = await getResourceDeptId(req);
      if (String(resourceDeptId) !== String(req.user.departmentId)) {
        return res.status(403).json({ error: 'Forbidden: outside your department' });
      }
      return next();
    } catch (error) {
      return res.status(500).json({ error: 'Internal server error while resolving department scope' });
    }
  }
  
  return res.status(403).json({ error: 'Forbidden: insufficient role' });
};

module.exports = scopeToDepartment;

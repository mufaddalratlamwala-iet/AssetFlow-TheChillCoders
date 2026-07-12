const Asset = require('../models/Asset');

const generateAssetTag = async () => {
    try {
        const count = await Asset.countDocuments();
        return `AF-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
        console.error('Error generating asset tag:', error);
        throw error;
    }
};

module.exports = generateAssetTag;

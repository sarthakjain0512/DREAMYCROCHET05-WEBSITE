const Setting = require('../models/Setting');
const { uploadImage } = require('../utils/imageHelper');
const { getLocalDB, saveLocalDB, isMongoDBConnected, DEFAULT_SETTINGS } = require('../utils/localDbHelper');
const { deleteCloudinaryImage } = require('../utils/deleteCloudinaryImage');

const getSettings = async (req, res) => {
  try {
    if (isMongoDBConnected()) {
      const s = await Setting.findOne();
      return res.json(s || DEFAULT_SETTINGS);
    } else {
      const db = getLocalDB();
      return res.json(db.settings || DEFAULT_SETTINGS);
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const updateSettings = async (req, res) => {
  const { heroTitle, heroSubtitleLine1, heroSubtitleLine2, heroImage } = req.body;

  try {
    // 1. Get previous settings image object to delete later
    let oldHeroImageObj = null;
    if (isMongoDBConnected()) {
      const s = await Setting.findOne();
      oldHeroImageObj = s ? s.heroImage : null;
    } else {
      const db = getLocalDB();
      oldHeroImageObj = db.settings ? db.settings.heroImage : null;
    }

    // 2. Upload new image first
    const uploadedCoverUrlObj = await uploadImage(heroImage, 'homepage');
    
    const updatedSettings = {
      heroTitle,
      heroSubtitleLine1,
      heroSubtitleLine2,
      heroImage: uploadedCoverUrlObj
    };

    // 3. Save to database
    if (isMongoDBConnected()) {
      let s = await Setting.findOne();
      if (!s) {
        s = new Setting(updatedSettings);
      } else {
        Object.assign(s, updatedSettings);
      }
      await s.save();
    } else {
      const db = getLocalDB();
      db.settings = updatedSettings;
      saveLocalDB();
    }

    // 4. Delete old Cloudinary asset only after successful database save/update
    if (oldHeroImageObj && oldHeroImageObj.public_id && oldHeroImageObj.public_id !== uploadedCoverUrlObj?.public_id) {
      await deleteCloudinaryImage(oldHeroImageObj);
    }

    return res.json(updatedSettings);
  } catch (err) {
    console.error('❌ updateSettings error:', err);
    return res.status(500).json({ error: err.message || 'Failed to update settings' });
  }
};

module.exports = {
  getSettings,
  updateSettings
};

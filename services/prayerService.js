// routes/prayers.js
const express = require('express');
const router = express.Router();
const PrayerService = require('../services/prayerService');
const { authenticateUser, optionalAuth } = require('../middleware/auth');

// GET /api/prayers - Pobierz publiczne modlitwy
router.get('/', optionalAuth, async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      search: req.query.search,
      tags: req.query.tags ? req.query.tags.split(',') : []
    };

    const prayers = await PrayerService.getPublicPrayers(filters);
    
    res.json({
      success: true,
      data: prayers,
      total: prayers.length
    });
  } catch (error) {
    console.error('Błąd pobierania modlitw:', error);
    res.status(500).json({
      success: false,
      error: 'Błąd pobierania modlitw'
    });
  }
});

// GET /api/prayers/:id - Pobierz pojedynczą modlitwę
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const prayer = await PrayerService.getPrayerById(
      req.params.id,
      req.token
    );
    
    res.json({
      success: true,
      data: prayer
    });
  } catch (error) {
    console.error('Błąd pobierania modlitwy:', error);
    res.status(404).json({
      success: false,
      error: 'Modlitwa nie została znaleziona'
    });
  }
});

// POST /api/prayers - Utwórz nową modlitwę (wymaga autoryzacji)
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { title, content, category, tags, is_public } = req.body;

    // Walidacja
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: 'Tytuł i treść modlitwy są wymagane'
      });
    }

    const prayerData = {
      title,
      content,
      category: category || null,
      tags: tags || [],
      is_public: is_public !== undefined ? is_public : true
    };

    const prayer = await PrayerService.createPrayer(
      prayerData,
      req.user.id,
      req.token
    );

    res.status(201).json({
      success: true,
      data: prayer,
      message: 'Modlitwa została utworzona'
    });
  } catch (error) {
    console.error('Błąd tworzenia modlitwy:', error);
    res.status(500).json({
      success: false,
      error: 'Błąd tworzenia modlitwy'
    });
  }
});

// PUT /api/prayers/:id - Aktualizuj modlitwę (wymaga autoryzacji)
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { title, content, category, tags, is_public } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (is_public !== undefined) updateData.is_public = is_public;

    const prayer = await PrayerService.updatePrayer(
      req.params.id,
      updateData,
      req.token
    );

    res.json({
      success: true,
      data: prayer,
      message: 'Modlitwa została zaktualizowana'
    });
  } catch (error) {
    console.error('Błąd aktualizacji modlitwy:', error);
    res.status(500).json({
      success: false,
      error: 'Błąd aktualizacji modlitwy'
    });
  }
});

// DELETE /api/prayers/:id - Usuń modlitwę (wymaga autoryzacji)
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    await PrayerService.deletePrayer(req.params.id, req.token);

    res.json({
      success: true,
      message: 'Modlitwa została usunięta'
    });
  } catch (error) {
    console.error('Błąd usuwania modlitwy:', error);
    res.status(500).json({
      success: false,
      error: 'Błąd usuwania modlitwy'
    });
  }
});

// GET /api/prayers/user/my - Pobierz modlitwy użytkownika (wymaga autoryzacji)
router.get('/user/my', authenticateUser, async (req, res) => {
  try {
    const prayers = await PrayerService.getUserPrayers(
      req.user.id,
      req.token
    );

    res.json({
      success: true,
      data: prayers,
      total: prayers.length
    });
  } catch (error) {
    console.error('Błąd pobierania modlitw użytkownika:', error);
    res.status(500).json({
      success: false,
      error: 'Błąd pobierania modlitw użytkownika'
    });
  }
});

// GET /api/prayers/favorites - Pobierz ulubione modlitwy (wymaga autoryzacji)
router.get('/favorites', authenticateUser, async (req, res) => {
  try {
    const prayers = await PrayerService.getFavoritePrayers(
      req.user.id,
      req.token
    );

    res.json({
      success: true,
      data: prayers,
      total: prayers.length
    });
  } catch (error) {
    console.error('Błąd pobierania ulubionych modlitw:', error);
    res.status(500).json({
      success: false,
      error: 'Błąd pobierania ulubionych modlitw'
    });
  }
});

// POST /api/prayers/:id/favorite - Dodaj do ulubionych (wymaga autoryzacji)
router.post('/:id/favorite', authenticateUser, async (req, res) => {
  try {
    await PrayerService.addToFavorites(
      req.user.id,
      req.params.id,
      req.token
    );

    res.json({
      success: true,
      message: 'Modlitwa została dodana do ulubionych'
    });
  } catch (error) {
    console.error('Błąd dodawania do ulubionych:', error);
    res.status(500).json({
      success: false,
      error: 'Błąd dodawania do ulubionych'
    });
  }
});

// DELETE /api/prayers/:id/favorite - Usuń z ulubionych (wymaga autoryzacji)
router.delete('/:id/favorite', authenticateUser, async (req, res) => {
  try {
    await PrayerService.removeFromFavorites(
      req.user.id,
      req.params.id,
      req.token
    );

    res.json({
      success: true,
      message: 'Modlitwa została usunięta z ulubionych'
    });
  } catch (error) {
    console.error('Błąd usuwania z ulubionych:', error);
    res.status(500).json({
      success: false,
      error: 'Błąd usuwania z ulubionych'
    });
  }
});

module.exports = router;
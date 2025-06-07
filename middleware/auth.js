// middleware/auth.js
const { supabase } = require('../config/supabase');

// Middleware do weryfikacji tokenu JWT od Supabase
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Brak tokenu autoryzacji' 
      });
    }

    const token = authHeader.substring(7); // Usuń "Bearer "

    // Weryfikacja tokenu w Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        error: 'Nieprawidłowy token autoryzacji' 
      });
    }

    // Dodaj informacje o użytkowniku do request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('Błąd autoryzacji:', error);
    res.status(500).json({ 
      error: 'Błąd serwera podczas autoryzacji' 
    });
  }
};

// Middleware opcjonalnej autoryzacji (dla publicznych endpointów)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        req.user = user;
        req.token = token;
      }
    }
    
    next();
  } catch (error) {
    // Ignoruj błędy autoryzacji dla opcjonalnych endpointów
    next();
  }
};

module.exports = {
  authenticateUser,
  optionalAuth
};
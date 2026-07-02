/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

// Read from environment variables
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// Check if credentials are valid/provided
export const isMock = !supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_project_url' || supabaseAnonKey === 'your_supabase_anon_key';

// Interface matching the profile structure in Supabase
export interface UserProfile {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  role: string;
  level: string;
  school: string;
  city: string;
  goal: string;
  daily_study_time: string;
  sound_enabled: boolean;
  notifications_enabled: boolean;
  dark_mode: boolean;
  created_at: string;
}

// --------------------------------------------------
// REAL SUPABASE CLIENT
// --------------------------------------------------
export const supabase = !isMock
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// --------------------------------------------------
// HIGH-FIDELITY MOCK / SIMULATION CLIENT (For preview without credentials)
// --------------------------------------------------
const STORAGE_KEYS = {
  USERS: 'studora_mock_users',
  CURRENT_USER: 'studora_mock_current_user',
  PROFILES: 'studora_mock_profiles',
};

// Initial setup helper for mock data
const getMockData = <T>(key: string, defaultValue: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(stored) as T;
  } catch {
    return defaultValue;
  }
};

const setMockData = <T>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

interface MockUser {
  id: string;
  email: string;
  password?: string;
  firstname?: string;
  lastname?: string;
}

// Global Auth state event listeners for mock client
type AuthChangeListener = (event: string, session: any) => void;
const authListeners = new Set<AuthChangeListener>();

// --------------------------------------------------
// EXPOSED UNIFIED AUTH & PROFILE SERVICE
// --------------------------------------------------
export const authService = {
  isMock,

  // Subscribe to auth state changes
  onAuthStateChange(callback: (user: any) => void) {
    if (!isMock && supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        callback(session?.user || null);
      });
      return () => subscription.unsubscribe();
    } else {
      // Mock subscription
      const handleStorageUpdate = () => {
        const user = getMockData<MockUser | null>(STORAGE_KEYS.CURRENT_USER, null);
        callback(user);
      };
      
      const listener: AuthChangeListener = (event, session) => {
        callback(session?.user || null);
      };
      authListeners.add(listener);

      // Trigger initial callback
      const initialUser = getMockData<MockUser | null>(STORAGE_KEYS.CURRENT_USER, null);
      callback(initialUser);

      return () => {
        authListeners.delete(listener);
      };
    }
  },

  // Sign Up
  async signUp(email: string, password: string,firstname: string, lastname: string) {
    if (!isMock && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstname,
            lastname,
          },
        },
      });
      
      if (error) throw error;
      
      // Immediately create a profile row for the new user if they successfully sign up
      if (data?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: data.user.id,
              firstname,
              lastname,
              email,
              role: '',
              level: '',
              school: '',
              city: '',
              goal: '',
              daily_study_time: '',
              sound_enabled: true,
              notifications_enabled: true,
              dark_mode: false,
              created_at: new Date().toISOString()
            }
          ]);
        if (profileError) console.error('Error creating profile row:', profileError);
      }
      
      return data;
    } else {
      // Mock SignUp
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate network lag
      const users = getMockData<MockUser[]>(STORAGE_KEYS.USERS, []);
      
      if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('Un compte avec cet e-mail existe déjà.');
      }

      const newUserId = Math.random().toString(36).substring(2, 15);
      const newUser: MockUser = { id: newUserId, email, password, firstname, lastname };
      
      users.push(newUser);
      setMockData(STORAGE_KEYS.USERS, users);

      // Create empty profile
      const profiles = getMockData<Record<string, UserProfile>>(STORAGE_KEYS.PROFILES, {});
      profiles[newUserId] = {
        id: newUserId,
        firstname,
        lastname,
        email,
        role: '',
        level: '',
        school: '',
        city: '',
        goal: '',
        daily_study_time: '',
        sound_enabled: true,
        notifications_enabled: true,
        dark_mode: false,
        created_at: new Date().toISOString(),
      };
      setMockData(STORAGE_KEYS.PROFILES, profiles);

      // Auto login
      setMockData(STORAGE_KEYS.CURRENT_USER, { id: newUserId, email, firstname, lastname });
      
      // Notify listeners
      authListeners.forEach(listener => listener('SIGNED_IN', { user: { id: newUserId, email, firstname, lastname } }));
      
      return { user: { id: newUserId, email } };
    }
  },

  // Sign In with password
  async signIn(email: string, password: string) {
    if (!isMock && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    } else {
      // Mock SignIn
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate network lag
      const users = getMockData<MockUser[]>(STORAGE_KEYS.USERS, []);
      const user = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );

      if (!user) {
        throw new Error('Identifiants incorrects. Veuillez réessayer.');
      }

      const sessionUser = { id: user.id, email: user.email, firstname: user.firstname, lastname: user.lastname };
      setMockData(STORAGE_KEYS.CURRENT_USER, sessionUser);
      
      // Notify listeners
      authListeners.forEach(listener => listener('SIGNED_IN', { user: sessionUser }));
      
      return { user: sessionUser };
    }
  },

  // Google OAuth Login
  async signInWithGoogle() {
    if (!isMock && supabase) {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      return data;
    } else {
      // Mock Google Login
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const mockGoogleId = 'google-' + Math.random().toString(36).substring(2, 10);
      const sessionUser = {
        id: mockGoogleId,
        email: 'user.google@gmail.com',
        firstname: 'Google',
        lastname: 'Student',
      };
      
      // Save user & profile
      const users = getMockData<MockUser[]>(STORAGE_KEYS.USERS, []);
      if (!users.some(u => u.id === mockGoogleId)) {
        users.push({ ...sessionUser, password: '' });
        setMockData(STORAGE_KEYS.USERS, users);
      }
      
      const profiles = getMockData<Record<string, UserProfile>>(STORAGE_KEYS.PROFILES, {});
      if (!profiles[mockGoogleId]) {
        profiles[mockGoogleId] = {
          id: mockGoogleId,
          firstname: sessionUser.firstname,
          lastname: sessionUser.lastname,
          email: sessionUser.email,
          role: '',
          level: '',
          school: '',
          city: '',
          goal: '',
          daily_study_time: '',
          sound_enabled: true,
          notifications_enabled: true,
          dark_mode: false,
          created_at: new Date().toISOString(),
        };
        setMockData(STORAGE_KEYS.PROFILES, profiles);
      }
      
      setMockData(STORAGE_KEYS.CURRENT_USER, sessionUser);
      authListeners.forEach(listener => listener('SIGNED_IN', { user: sessionUser }));
      
      return { user: sessionUser };
    }
  },

  // Sign Out
  async signOut() {
    if (!isMock && supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } else {
      // Mock SignOut
      setMockData(STORAGE_KEYS.CURRENT_USER, null);
      authListeners.forEach(listener => listener('SIGNED_OUT', null));
    }
  },

  // Get current session user
  getCurrentUser() {
    if (!isMock && supabase) {
      // In a real app we can grab the user from the current session
      return supabase.auth.getUser().then(({ data }) => data.user);
    } else {
      return getMockData<MockUser | null>(STORAGE_KEYS.CURRENT_USER, null);
    }
  },

  // Get current user profile
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (!isMock && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        // If profile doesn't exist, try creating one
        if (error.code === 'PGRST116') {
          const { data: userObj } = await supabase.auth.getUser();
          if (userObj?.user) {
            const newProfile: Partial<UserProfile> = {
              id: userId,
              firstname: userObj.user.user_metadata?.firstname || '',
              lastname: userObj.user.user_metadata?.lastname || '',
              email: userObj.user.email || '',
              role: '',
              level: '',
              school: '',
              city: '',
              goal: '',
              daily_study_time: '',
              sound_enabled: true,
              notifications_enabled: true,
              dark_mode: false,
              created_at: new Date().toISOString()
            };
            const { data: created, error: createErr } = await supabase
              .from('profiles')
              .insert([newProfile])
              .select()
              .single();
            if (!createErr) return created;
          }
        }
        console.error('Error fetching profile from Supabase:', error);
        return null;
      }
      return data;
    } else {
      // Mock Profile
      const profiles = getMockData<Record<string, UserProfile>>(STORAGE_KEYS.PROFILES, {});
      return profiles[userId] || null;
    }
  },

  // Update profile data
  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile> {
    if (!isMock && supabase) {
      const { data: updated, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', userId)
        .select()
        .single();
        
      if (error) {
        // Fallback: if record didn't exist, try insert
        const { data: inserted, error: insertError } = await supabase
          .from('profiles')
          .upsert({ id: userId, ...data })
          .select()
          .single();
          
        if (insertError) throw insertError;
        return inserted;
      }
      return updated;
    } else {
      // Mock Profile Update
      const profiles = getMockData<Record<string, UserProfile>>(STORAGE_KEYS.PROFILES, {});
      const current = profiles[userId] || {
        id: userId,
        firstname: '',
        lastname: '',
        email: '',
        role: '',
        level: '',
        school: '',
        city: '',
        goal: '',
        daily_study_time: '',
        sound_enabled: true,
        notifications_enabled: true,
        dark_mode: false,
        created_at: new Date().toISOString(),
      };
      
      const updatedProfile = {
        ...current,
        ...data,
      };
      
      profiles[userId] = updatedProfile;
      setMockData(STORAGE_KEYS.PROFILES, profiles);
      return updatedProfile;
    }
  }
};

// --------------------------------------------------
// HIGH-FIDELITY DATABASE SCHEMA & QUERIES
// --------------------------------------------------
export interface DocumentRow {
  id: string;
  user_id: string;
  name: string;
  size: string;
  type: string;
  status: 'ready' | 'analyzing' | 'analyzed' | 'error';
  archived: boolean;
  created_at: string;
}

export interface QuizRow {
  id: string;
  user_id: string;
  document_id?: string;
  title: string;
  score: number | null;
  max_score: number;
  questions: {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  }[];
  completed: boolean;
  created_at: string;
}

export interface FlashcardRow {
  id: string;
  user_id: string;
  document_id?: string;
  front: string;
  back: string;
  created_at: string;
}

export interface ProgressRow {
  id: string;
  user_id: string;
  xp: number;
  level: string;
  streak: number;
  hours_studied: number;
  daily_goal_pct: number;
  last_active: string;
}

const DB_MOCK_KEYS = {
  DOCUMENTS: 'studora_db_documents',
  QUIZZES: 'studora_db_quizzes',
  FLASHCARDS: 'studora_db_flashcards',
  PROGRESS: 'studora_db_progress',
};

export const dbService = {
  // Get all active documents
  async getDocuments(userId: string): Promise<DocumentRow[]> {
    if (!isMock && supabase) {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .eq('archived', false)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching documents from Supabase:', error);
        return [];
      }
      return data || [];
    } else {
      const docs = getMockData<DocumentRow[]>(DB_MOCK_KEYS.DOCUMENTS, [
        { id: 'doc-1', user_id: userId, name: 'Biologie_Cellulaire_L1.pdf', size: '2.4 MB', type: 'PDF', status: 'analyzed', archived: false, created_at: new Date(Date.now() - 86400000).toISOString() },
        { id: 'doc-2', user_id: userId, name: 'Histoire_Contemporaine_S1.pdf', size: '1.1 MB', type: 'PDF', status: 'analyzed', archived: false, created_at: new Date(Date.now() - 172800000).toISOString() },
        { id: 'doc-3', user_id: userId, name: 'Economie_Introduction.pdf', size: '4.8 MB', type: 'PDF', status: 'ready', archived: false, created_at: new Date(Date.now() - 604800000).toISOString() },
      ]);
      return docs.filter(doc => doc.user_id === userId && !doc.archived);
    }
  },

  // Get archived documents
  async getArchivedDocuments(userId: string): Promise<DocumentRow[]> {
    if (!isMock && supabase) {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', userId)
        .eq('archived', true)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching archived documents from Supabase:', error);
        return [];
      }
      return data || [];
    } else {
      const docs = getMockData<DocumentRow[]>(DB_MOCK_KEYS.DOCUMENTS, []);
      return docs.filter(doc => doc.user_id === userId && doc.archived);
    }
  },

  // Insert new document
  async uploadDocument(userId: string, name: string, size: string, type: string): Promise<DocumentRow> {
    const newDoc: DocumentRow = {
      id: 'doc-' + Math.random().toString(36).substring(2, 10),
      user_id: userId,
      name,
      size,
      type,
      status: 'analyzing',
      archived: false,
      created_at: new Date().toISOString(),
    };

    if (!isMock && supabase) {
      const { data, error } = await supabase
        .from('documents')
        .insert([newDoc])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const docs = getMockData<DocumentRow[]>(DB_MOCK_KEYS.DOCUMENTS, []);
      docs.unshift(newDoc);
      setMockData(DB_MOCK_KEYS.DOCUMENTS, docs);
      return newDoc;
    }
  },

  // Update document status
  async updateDocumentStatus(docId: string, status: 'ready' | 'analyzing' | 'analyzed' | 'error'): Promise<void> {
    if (!isMock && supabase) {
      const { error } = await supabase
        .from('documents')
        .update({ status })
        .eq('id', docId);
      if (error) throw error;
    } else {
      const docs = getMockData<DocumentRow[]>(DB_MOCK_KEYS.DOCUMENTS, []);
      const index = docs.findIndex(doc => doc.id === docId);
      if (index !== -1) {
        docs[index].status = status;
        setMockData(DB_MOCK_KEYS.DOCUMENTS, docs);
      }
    }
  },

  // Delete document
  async deleteDocument(docId: string): Promise<void> {
    if (!isMock && supabase) {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId);
      if (error) throw error;
    } else {
      const docs = getMockData<DocumentRow[]>(DB_MOCK_KEYS.DOCUMENTS, []);
      const updated = docs.filter(doc => doc.id !== docId);
      setMockData(DB_MOCK_KEYS.DOCUMENTS, updated);
    }
  },

  // Archive / unarchive document
  async archiveDocument(docId: string, archived: boolean): Promise<void> {
    if (!isMock && supabase) {
      const { error } = await supabase
        .from('documents')
        .update({ archived })
        .eq('id', docId);
      if (error) throw error;
    } else {
      const docs = getMockData<DocumentRow[]>(DB_MOCK_KEYS.DOCUMENTS, []);
      const index = docs.findIndex(doc => doc.id === docId);
      if (index !== -1) {
        docs[index].archived = archived;
        setMockData(DB_MOCK_KEYS.DOCUMENTS, docs);
      }
    }
  },

  // Get quizzes
  async getQuizzes(userId: string): Promise<QuizRow[]> {
    if (!isMock && supabase) {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching quizzes:', error);
        return [];
      }
      return data || [];
    } else {
      return getMockData<QuizRow[]>(DB_MOCK_KEYS.QUIZZES, [
        {
          id: 'quiz-1',
          user_id: userId,
          document_id: 'doc-1',
          title: 'Méthodes Actives de Révisions',
          score: 3,
          max_score: 3,
          completed: true,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          questions: [
            {
              question: "Quelle est la méthode d'apprentissage la plus efficace supportée par Studora ?",
              options: ["La relecture passive de ses notes", "La répétition espacée et le test actif", "Le bachotage la veille de l'examen"],
              correct: 1,
              explanation: "La répétition espacée et l'auto-évaluation active stimulent les connexions neuronales à long terme !"
            },
            {
              question: "Quel format de cours pouvez-vous importer sur la plateforme Studora ?",
              options: ["Uniquement du texte brut", "Des PDF, fichiers Word, EPUB et notes", "Seulement des captures d'écran"],
              correct: 1,
              explanation: "Studora est polyvalent et gère vos PDF, Word, EPUB et notes de révision pour en extraire l'essence."
            },
            {
              question: "Comment Studora vous aide-t-il à rester motivé pour réviser ?",
              options: ["Par un système de classement d'XP amical", "En bloquant votre téléphone portable", "En envoyant des emails à vos parents"],
              correct: 0,
              explanation: "L'XP amical et le classement stimulent une saine émulation positive sans stress inutile."
            }
          ]
        }
      ]).filter(q => q.user_id === userId);
    }
  },

  // Create quiz
  async createQuiz(userId: string, title: string, questions: any[], docId?: string): Promise<QuizRow> {
    const newQuiz: QuizRow = {
      id: 'quiz-' + Math.random().toString(36).substring(2, 10),
      user_id: userId,
      document_id: docId,
      title,
      score: null,
      max_score: questions.length,
      questions,
      completed: false,
      created_at: new Date().toISOString(),
    };

    if (!isMock && supabase) {
      const { data, error } = await supabase
        .from('quizzes')
        .insert([newQuiz])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const quizzes = getMockData<QuizRow[]>(DB_MOCK_KEYS.QUIZZES, []);
      quizzes.unshift(newQuiz);
      setMockData(DB_MOCK_KEYS.QUIZZES, quizzes);
      return newQuiz;
    }
  },

  // Update quiz score
  async submitQuizScore(quizId: string, score: number): Promise<void> {
    if (!isMock && supabase) {
      const { error } = await supabase
        .from('quizzes')
        .update({ score, completed: true })
        .eq('id', quizId);
      if (error) throw error;
    } else {
      const quizzes = getMockData<QuizRow[]>(DB_MOCK_KEYS.QUIZZES, []);
      const index = quizzes.findIndex(q => q.id === quizId);
      if (index !== -1) {
        quizzes[index].score = score;
        quizzes[index].completed = true;
        setMockData(DB_MOCK_KEYS.QUIZZES, quizzes);
      }
    }
  },

  // Get Flashcards
  async getFlashcards(userId: string): Promise<FlashcardRow[]> {
    if (!isMock && supabase) {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Error fetching flashcards:', error);
        return [];
      }
      return data || [];
    } else {
      return getMockData<FlashcardRow[]>(DB_MOCK_KEYS.FLASHCARDS, [
        { id: 'fc-1', user_id: userId, document_id: 'doc-1', front: "Qu'est-ce que la répétition espacée ?", back: "Une technique d'apprentissage qui consiste à réviser un concept à intervalles croissants pour optimiser la rétention à long terme.", created_at: new Date().toISOString() },
        { id: 'fc-2', user_id: userId, document_id: 'doc-1', front: "Comment fonctionne la plasticité neuronale ?", back: "C'est la capacité du cerveau à créer, renforcer ou éliminer des connexions neuronales en fonction des expériences d'apprentissage.", created_at: new Date().toISOString() },
        { id: 'fc-3', user_id: userId, document_id: 'doc-1', front: "Qu'est-ce qu'une flashcard active ?", back: "Une carte de révision recto-verso forçant l'effort de récupération (Active Recall), bien plus efficace que la simple relecture.", created_at: new Date().toISOString() },
      ]).filter(fc => fc.user_id === userId);
    }
  },

  // Create flashcard
  async createFlashcard(userId: string, front: string, back: string, docId?: string): Promise<FlashcardRow> {
    const newFc: FlashcardRow = {
      id: 'fc-' + Math.random().toString(36).substring(2, 10),
      user_id: userId,
      document_id: docId,
      front,
      back,
      created_at: new Date().toISOString(),
    };

    if (!isMock && supabase) {
      const { data, error } = await supabase
        .from('flashcards')
        .insert([newFc])
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const fcs = getMockData<FlashcardRow[]>(DB_MOCK_KEYS.FLASHCARDS, []);
      fcs.unshift(newFc);
      setMockData(DB_MOCK_KEYS.FLASHCARDS, fcs);
      return newFc;
    }
  },

  // Delete flashcard
  async deleteFlashcard(fcId: string): Promise<void> {
    if (!isMock && supabase) {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', fcId);
      if (error) throw error;
    } else {
      const fcs = getMockData<FlashcardRow[]>(DB_MOCK_KEYS.FLASHCARDS, []);
      const updated = fcs.filter(fc => fc.id !== fcId);
      setMockData(DB_MOCK_KEYS.FLASHCARDS, updated);
    }
  },

  // Get user progression metrics
  async getProgress(userId: string): Promise<ProgressRow> {
    if (!isMock && supabase) {
      const { data, error } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error) {
        if (error.code === 'PGRST116') {
          // Row doesn't exist, create default
          const defaultProgress: ProgressRow = {
            id: 'prog-' + Math.random().toString(36).substring(2, 10),
            user_id: userId,
            xp: 420,
            level: 'Étoile montante',
            streak: 3,
            hours_studied: 4.5,
            daily_goal_pct: 35,
            last_active: new Date().toISOString(),
          };
          const { data: inserted, error: insErr } = await supabase
            .from('progress')
            .insert([defaultProgress])
            .select()
            .single();
          if (!insErr && inserted) return inserted;
        }
        console.error('Error fetching progress from Supabase:', error);
      }
      return data || { id: 'default', user_id: userId, xp: 420, level: 'Étoile montante', streak: 3, hours_studied: 4.5, daily_goal_pct: 35, last_active: new Date().toISOString() };
    } else {
      const progress = getMockData<Record<string, ProgressRow>>(DB_MOCK_KEYS.PROGRESS, {});
      if (!progress[userId]) {
        progress[userId] = {
          id: 'prog-' + Math.random().toString(36).substring(2, 10),
          user_id: userId,
          xp: 420,
          level: 'Étoile montante',
          streak: 3,
          hours_studied: 4.5,
          daily_goal_pct: 35,
          last_active: new Date().toISOString(),
        };
        setMockData(DB_MOCK_KEYS.PROGRESS, progress);
      }
      return progress[userId];
    }
  },

  // Update progress stats (like earning XP or updating streak)
  async updateProgress(userId: string, data: Partial<ProgressRow>): Promise<ProgressRow> {
    if (!isMock && supabase) {
      const { data: updated, error } = await supabase
        .from('progress')
        .update(data)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return updated;
    } else {
      const progress = getMockData<Record<string, ProgressRow>>(DB_MOCK_KEYS.PROGRESS, {});
      const current = progress[userId] || {
        id: 'prog-' + Math.random().toString(36).substring(2, 10),
        user_id: userId,
        xp: 420,
        level: 'Étoile montante',
        streak: 3,
        hours_studied: 4.5,
        daily_goal_pct: 35,
        last_active: new Date().toISOString(),
      };
      
      const updatedRow = {
        ...current,
        ...data,
      };
      progress[userId] = updatedRow;
      setMockData(DB_MOCK_KEYS.PROGRESS, progress);
      return updatedRow;
    }
  },

  // Get complete leaderboard list
  async getLeaderboard(): Promise<{ name: string; score: number; level: string; isCurrentUser?: boolean }[]> {
    if (!isMock && supabase) {
      // Fetch user profiles and join or grab progress list
      const { data, error } = await supabase
        .from('progress')
        .select(`
          xp,
          level,
          profiles (
            firstname,
            lastname,
            id
          )
        `)
        .order('xp', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching leaderboard:', error);
        return [];
      }

      return (data || []).map((row: any) => ({
        name: row.profiles ? `${row.profiles.firstname} ${row.profiles.lastname[0]}.` : 'Étudiant Anonyme',
        score: row.xp,
        level: row.level || 'Bêta-testeur',
      }));
    } else {
      // Mock leaderboard
      return [
        { name: 'Lucas Bourgeois', score: 1280, level: 'Majors de promo' },
        { name: 'Léa Bernard', score: 1140, level: 'Élite intellectuelle' },
        { name: 'Thomas Petit', score: 950, level: 'Esprit brillant' },
        { name: 'Sarah Dubois', score: 820, level: 'Savant passionné' },
        { name: 'Maxime Lefevre', score: 710, level: 'Étudiant d\'élite' },
        { name: 'Chloé Martin', score: 600, level: 'Futur génie' },
        { name: 'Antoine Morel', score: 540, level: 'Explorateur de savoir' },
        { name: 'Julie Faure', score: 480, level: 'Esprit curieux' },
        { name: 'Vous', score: 420, level: 'Étoile montante', isCurrentUser: true },
        { name: 'Nicolas Roux', score: 380, level: 'Novice enthousiaste' },
      ];
    }
  }
};

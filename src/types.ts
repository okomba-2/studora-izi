/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Feature {
  id: string;
  title: string;
  description: string;
  iconName: string; // Used to dynamically map Lucide Icons
  tag?: string;
}

export interface HowItWorksStep {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
}

export interface LeaderboardUser {
  id: number;
  rank: number;
  name: string;
  avatarUrl?: string;
  className: string;
  score: number;
  isCurrentUser?: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  buttonText: string;
  isPopular: boolean;
  tag?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export interface DemoDocument {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'epub';
  size: string;
  date: string;
  status: 'analyzed' | 'analyzing' | 'ready';
  summary?: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

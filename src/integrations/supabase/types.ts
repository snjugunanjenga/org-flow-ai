export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_newsletters: {
        Row: {
          body: string
          created_at: string
          id: string
          sent_at: string
          sent_by: string
          subject: string
          target_audience: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sent_at?: string
          sent_by: string
          subject: string
          target_audience?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sent_at?: string
          sent_by?: string
          subject?: string
          target_audience?: string
        }
        Relationships: []
      }
      agent_logs: {
        Row: {
          action: string
          agent_type: string
          created_at: string
          duration_ms: number | null
          id: string
          input_summary: string | null
          org_id: string
          output_summary: string | null
          reasoning: string | null
        }
        Insert: {
          action: string
          agent_type: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          input_summary?: string | null
          org_id: string
          output_summary?: string | null
          reasoning?: string | null
        }
        Update: {
          action?: string
          agent_type?: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          input_summary?: string | null
          org_id?: string
          output_summary?: string | null
          reasoning?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          attendees: string[] | null
          created_at: string
          created_by: string
          description: string | null
          end_time: string
          event_type: string | null
          id: string
          location: string | null
          meet_link: string | null
          org_id: string
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          attendees?: string[] | null
          created_at?: string
          created_by: string
          description?: string | null
          end_time: string
          event_type?: string | null
          id?: string
          location?: string | null
          meet_link?: string | null
          org_id: string
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          attendees?: string[] | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_time?: string
          event_type?: string | null
          id?: string
          location?: string | null
          meet_link?: string | null
          org_id?: string
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_logs: {
        Row: {
          avg_response_time_mins: number | null
          collaboration_score: number | null
          created_at: string
          id: string
          messages_count: number | null
          org_id: string
          period: string
          sentiment_score: number | null
          team_name: string
        }
        Insert: {
          avg_response_time_mins?: number | null
          collaboration_score?: number | null
          created_at?: string
          id?: string
          messages_count?: number | null
          org_id: string
          period?: string
          sentiment_score?: number | null
          team_name: string
        }
        Update: {
          avg_response_time_mins?: number | null
          collaboration_score?: number | null
          created_at?: string
          id?: string
          messages_count?: number | null
          org_id?: string
          period?: string
          sentiment_score?: number | null
          team_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conflicts: {
        Row: {
          created_at: string
          description: string
          detected_by: string | null
          id: string
          org_id: string
          parties: string[] | null
          resolution: string | null
          resolved_at: string | null
          severity: string
          status: string
          title: string
          topic_ids: string[] | null
        }
        Insert: {
          created_at?: string
          description: string
          detected_by?: string | null
          id?: string
          org_id: string
          parties?: string[] | null
          resolution?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title: string
          topic_ids?: string[] | null
        }
        Update: {
          created_at?: string
          description?: string
          detected_by?: string | null
          id?: string
          org_id?: string
          parties?: string[] | null
          resolution?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
          topic_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "conflicts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      direct_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_team_message: boolean | null
          org_id: string
          read: boolean | null
          recipient_id: string | null
          sender_id: string
          team_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_team_message?: boolean | null
          org_id: string
          read?: boolean | null
          recipient_id?: string | null
          sender_id: string
          team_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_team_message?: boolean | null
          org_id?: string
          read?: boolean | null
          recipient_id?: string | null
          sender_id?: string
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "direct_messages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "direct_messages_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      document_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          org_id: string
          resource_id: string
          resource_type: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          org_id: string
          resource_id: string
          resource_type: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          org_id?: string
          resource_id?: string
          resource_type?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_attachments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      google_oauth_tokens: {
        Row: {
          access_token: string
          created_at: string
          id: string
          refresh_token: string
          scope: string | null
          token_expires_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          id?: string
          refresh_token: string
          scope?: string | null
          token_expires_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          refresh_token?: string
          scope?: string | null
          token_expires_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      graph_edges: {
        Row: {
          created_at: string
          id: string
          org_id: string
          relationship: string
          source_label: string
          source_type: string
          target_label: string
          target_type: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          relationship: string
          source_label: string
          source_type: string
          target_label: string
          target_type: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          relationship?: string
          source_label?: string
          source_type?: string
          target_label?: string
          target_type?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "graph_edges_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          org_id: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          org_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_summaries: {
        Row: {
          action_items: Json | null
          created_at: string
          id: string
          key_decisions: string[] | null
          org_id: string
          sentiment: string | null
          summary: string
          title: string
          transcript_id: string | null
        }
        Insert: {
          action_items?: Json | null
          created_at?: string
          id?: string
          key_decisions?: string[] | null
          org_id: string
          sentiment?: string | null
          summary: string
          title: string
          transcript_id?: string | null
        }
        Update: {
          action_items?: Json | null
          created_at?: string
          id?: string
          key_decisions?: string[] | null
          org_id?: string
          sentiment?: string | null
          summary?: string
          title?: string
          transcript_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_summaries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_summaries_transcript_id_fkey"
            columns: ["transcript_id"]
            isOneToOne: false
            referencedRelation: "meeting_transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_transcripts: {
        Row: {
          channel: string | null
          content: string
          created_at: string
          duration_minutes: number | null
          id: string
          meeting_date: string
          org_id: string
          participants: string[] | null
          title: string
        }
        Insert: {
          channel?: string | null
          content: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          meeting_date?: string
          org_id: string
          participants?: string[] | null
          title: string
        }
        Update: {
          channel?: string | null
          content?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          meeting_date?: string
          org_id?: string
          participants?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_transcripts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          channel: string | null
          content: string
          created_at: string
          id: string
          metadata: Json | null
          org_id: string
          recipients: string[] | null
          sender_name: string
          sender_user_id: string | null
          source_type: string
          subject: string | null
        }
        Insert: {
          channel?: string | null
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          org_id: string
          recipients?: string[] | null
          sender_name: string
          sender_user_id?: string | null
          source_type?: string
          subject?: string | null
        }
        Update: {
          channel?: string | null
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          org_id?: string
          recipients?: string[] | null
          sender_name?: string
          sender_user_id?: string | null
          source_type?: string
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          org_id: string
          read: boolean | null
          reasoning: string | null
          source_agent: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          org_id: string
          read?: boolean | null
          reasoning?: string | null
          source_agent?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          org_id?: string
          read?: boolean | null
          reasoning?: string | null
          source_agent?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_memberships: {
        Row: {
          id: string
          joined_at: string
          org_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          org_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          org_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          display_name: string | null
          id: string
          job_title: string | null
          onboarding_completed: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          id?: string
          job_title?: string | null
          onboarding_completed?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          id?: string
          job_title?: string | null
          onboarding_completed?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_milestones: {
        Row: {
          created_at: string
          id: string
          name: string
          org_id: string
          project_id: string
          status: string | null
          target_date: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          org_id: string
          project_id: string
          status?: string | null
          target_date?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          project_id?: string
          status?: string | null
          target_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_milestones_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assignee_name: string | null
          created_at: string
          due_date: string | null
          id: string
          milestone_id: string | null
          org_id: string
          priority: string | null
          project_id: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee_name?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          milestone_id?: string | null
          org_id: string
          priority?: string | null
          project_id: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee_name?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          milestone_id?: string | null
          org_id?: string
          priority?: string | null
          project_id?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "project_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          content: string
          created_at: string
          generated_by: string | null
          id: string
          org_id: string
          project_id: string
        }
        Insert: {
          content: string
          created_at?: string
          generated_by?: string | null
          id?: string
          org_id: string
          project_id: string
        }
        Update: {
          content?: string
          created_at?: string
          generated_by?: string | null
          id?: string
          org_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          org_id: string
          owner_name: string | null
          progress: number | null
          start_date: string | null
          status: string
          target_date: string | null
          team_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          org_id: string
          owner_name?: string | null
          progress?: number | null
          start_date?: string | null
          status?: string
          target_date?: string | null
          team_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          owner_name?: string | null
          progress?: number | null
          start_date?: string | null
          status?: string
          target_date?: string | null
          team_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_chats: {
        Row: {
          citations: Json | null
          content: string
          created_at: string
          id: string
          notebook_id: string
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          citations?: Json | null
          content: string
          created_at?: string
          id?: string
          notebook_id: string
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          citations?: Json | null
          content?: string
          created_at?: string
          id?: string
          notebook_id?: string
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_chats_notebook_id_fkey"
            columns: ["notebook_id"]
            isOneToOne: false
            referencedRelation: "resource_notebooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_chats_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_notebooks: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          org_id: string
          project_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          org_id: string
          project_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          org_id?: string
          project_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_notebooks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_notebooks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_outputs: {
        Row: {
          content: Json
          created_at: string
          id: string
          notebook_id: string
          org_id: string
          output_type: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          notebook_id: string
          org_id: string
          output_type?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          notebook_id?: string
          org_id?: string
          output_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_outputs_notebook_id_fkey"
            columns: ["notebook_id"]
            isOneToOne: false
            referencedRelation: "resource_notebooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_outputs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_sources: {
        Row: {
          content: string
          created_at: string
          file_url: string | null
          id: string
          metadata: Json | null
          notebook_id: string
          org_id: string
          source_type: string
          title: string
        }
        Insert: {
          content?: string
          created_at?: string
          file_url?: string | null
          id?: string
          metadata?: Json | null
          notebook_id: string
          org_id: string
          source_type?: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          file_url?: string | null
          id?: string
          metadata?: Json | null
          notebook_id?: string
          org_id?: string
          source_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_sources_notebook_id_fkey"
            columns: ["notebook_id"]
            isOneToOne: false
            referencedRelation: "resource_notebooks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_sources_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string
          id: string
          org_id: string
          plan: string
          status: string
          trial_ends_at: string
          updated_at: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          org_id: string
          plan?: string
          status?: string
          trial_ends_at?: string
          updated_at?: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string
          id?: string
          org_id?: string
          plan?: string
          status?: string
          trial_ends_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      team_memberships: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          org_id: string
          team_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          org_id: string
          team_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          org_id?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          org_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          org_id: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          org_id: string
          owner_name: string | null
          priority: string | null
          source_id: string | null
          source_type: string | null
          status: string | null
          title: string
          updated_at: string
          version: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          org_id: string
          owner_name?: string | null
          priority?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          title: string
          updated_at?: string
          version?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          org_id?: string
          owner_name?: string | null
          priority?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "topics_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: { Args: { _token: string }; Returns: Json }
      has_org_role: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_manager_or_admin: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "member"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "member"],
    },
  },
} as const

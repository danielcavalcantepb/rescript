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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accounts_payable: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          branch_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          company_id: string | null
          created_at: string
          created_by: string
          currency: string
          goods_receipt_id: string
          goods_receipt_number: string
          goods_receipt_received_at: string | null
          id: string
          issue_date: string
          notes: string | null
          number: string
          open_balance: number
          organization_id: string
          original_amount: number
          previous_status: string | null
          purchase_number: string
          purchase_order_id: string
          status: string
          supplier_document: string | null
          supplier_email: string | null
          supplier_id: string
          supplier_legal_name: string
          supplier_phone: string | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          branch_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          company_id?: string | null
          created_at?: string
          created_by: string
          currency?: string
          goods_receipt_id: string
          goods_receipt_number: string
          goods_receipt_received_at?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          number: string
          open_balance: number
          organization_id: string
          original_amount: number
          previous_status?: string | null
          purchase_number: string
          purchase_order_id: string
          status?: string
          supplier_document?: string | null
          supplier_email?: string | null
          supplier_id: string
          supplier_legal_name: string
          supplier_phone?: string | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          branch_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          goods_receipt_id?: string
          goods_receipt_number?: string
          goods_receipt_received_at?: string | null
          id?: string
          issue_date?: string
          notes?: string | null
          number?: string
          open_balance?: number
          organization_id?: string
          original_amount?: number
          previous_status?: string | null
          purchase_number?: string
          purchase_order_id?: string
          status?: string
          supplier_document?: string | null
          supplier_email?: string | null
          supplier_id?: string
          supplier_legal_name?: string
          supplier_phone?: string | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_payable_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_goods_receipt_id_fkey"
            columns: ["goods_receipt_id"]
            isOneToOne: false
            referencedRelation: "goods_receipt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts_payable_history: {
        Row: {
          accounts_payable_id: string
          action: string
          actor_ip: string | null
          actor_user_id: string
          created_at: string
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
          organization_id: string
          reason: string | null
        }
        Insert: {
          accounts_payable_id: string
          action: string
          actor_ip?: string | null
          actor_user_id: string
          created_at?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id: string
          reason?: string | null
        }
        Update: {
          accounts_payable_id?: string
          action?: string
          actor_ip?: string | null
          actor_user_id?: string
          created_at?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_payable_history_accounts_payable_id_fkey"
            columns: ["accounts_payable_id"]
            isOneToOne: false
            referencedRelation: "accounts_payable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_history_accounts_payable_id_fkey"
            columns: ["accounts_payable_id"]
            isOneToOne: false
            referencedRelation: "analytics_payable_open_fact"
            referencedColumns: ["payable_id"]
          },
          {
            foreignKeyName: "accounts_payable_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts_payable_number_counter: {
        Row: {
          last_value: number
          organization_id: string
        }
        Insert: {
          last_value?: number
          organization_id: string
        }
        Update: {
          last_value?: number
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_payable_number_counter_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts_payable_search: {
        Row: {
          accounts_payable_id: string
          created_at: string
          currency: string
          goods_receipt_number: string
          issue_date: string
          next_due_date: string | null
          number: string
          open_balance: number
          organization_id: string
          original_amount: number
          purchase_number: string
          search_text: string
          status: string
          supplier_document: string | null
          supplier_legal_name: string
          updated_at: string
        }
        Insert: {
          accounts_payable_id: string
          created_at: string
          currency: string
          goods_receipt_number: string
          issue_date: string
          next_due_date?: string | null
          number: string
          open_balance: number
          organization_id: string
          original_amount: number
          purchase_number: string
          search_text?: string
          status: string
          supplier_document?: string | null
          supplier_legal_name: string
          updated_at?: string
        }
        Update: {
          accounts_payable_id?: string
          created_at?: string
          currency?: string
          goods_receipt_number?: string
          issue_date?: string
          next_due_date?: string | null
          number?: string
          open_balance?: number
          organization_id?: string
          original_amount?: number
          purchase_number?: string
          search_text?: string
          status?: string
          supplier_document?: string | null
          supplier_legal_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_payable_search_accounts_payable_id_fkey"
            columns: ["accounts_payable_id"]
            isOneToOne: true
            referencedRelation: "accounts_payable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_search_accounts_payable_id_fkey"
            columns: ["accounts_payable_id"]
            isOneToOne: true
            referencedRelation: "analytics_payable_open_fact"
            referencedColumns: ["payable_id"]
          },
          {
            foreignKeyName: "accounts_payable_search_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts_receivable: {
        Row: {
          archived_at: string | null
          branch_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          company_id: string | null
          created_at: string
          created_by: string
          currency: string
          customer_document: string | null
          customer_email: string | null
          customer_id: string
          customer_name: string
          customer_phone: string | null
          due_date: string
          id: string
          issue_date: string
          notes: string | null
          number: string
          open_amount: number
          organization_id: string
          origin_id: string | null
          origin_type: string
          paid_amount: number
          status: string
          total_amount: number
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          branch_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          company_id?: string | null
          created_at?: string
          created_by: string
          currency?: string
          customer_document?: string | null
          customer_email?: string | null
          customer_id: string
          customer_name: string
          customer_phone?: string | null
          due_date: string
          id?: string
          issue_date: string
          notes?: string | null
          number: string
          open_amount: number
          organization_id: string
          origin_id?: string | null
          origin_type: string
          paid_amount?: number
          status?: string
          total_amount: number
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          branch_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          customer_document?: string | null
          customer_email?: string | null
          customer_id?: string
          customer_name?: string
          customer_phone?: string | null
          due_date?: string
          id?: string
          issue_date?: string
          notes?: string | null
          number?: string
          open_amount?: number
          organization_id?: string
          origin_id?: string | null
          origin_type?: string
          paid_amount?: number
          status?: string
          total_amount?: number
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "analytics_customer_fact"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "accounts_receivable_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts_receivable_counter: {
        Row: {
          last_value: number
          organization_id: string
        }
        Insert: {
          last_value?: number
          organization_id: string
        }
        Update: {
          last_value?: number
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_counter_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts_receivable_history: {
        Row: {
          accounts_receivable_id: string
          action: string
          actor_user_id: string
          created_at: string
          id: string
          new_value: string | null
          old_value: string | null
          organization_id: string
          reason: string | null
        }
        Insert: {
          accounts_receivable_id: string
          action: string
          actor_user_id: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id: string
          reason?: string | null
        }
        Update: {
          accounts_receivable_id?: string
          action?: string
          actor_user_id?: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_history_accounts_receivable_id_fkey"
            columns: ["accounts_receivable_id"]
            isOneToOne: false
            referencedRelation: "accounts_receivable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_history_accounts_receivable_id_fkey"
            columns: ["accounts_receivable_id"]
            isOneToOne: false
            referencedRelation: "analytics_receivable_open_fact"
            referencedColumns: ["receivable_id"]
          },
          {
            foreignKeyName: "accounts_receivable_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts_receivable_search: {
        Row: {
          accounts_receivable_id: string
          currency: string
          customer_document: string | null
          customer_id: string
          customer_name: string
          due_date: string
          number: string
          open_amount: number
          organization_id: string
          paid_amount: number
          search_text: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          accounts_receivable_id: string
          currency: string
          customer_document?: string | null
          customer_id: string
          customer_name: string
          due_date: string
          number: string
          open_amount: number
          organization_id: string
          paid_amount: number
          search_text: string
          status: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          accounts_receivable_id?: string
          currency?: string
          customer_document?: string | null
          customer_id?: string
          customer_name?: string
          due_date?: string
          number?: string
          open_amount?: number
          organization_id?: string
          paid_amount?: number
          search_text?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_search_accounts_receivable_id_fkey"
            columns: ["accounts_receivable_id"]
            isOneToOne: true
            referencedRelation: "accounts_receivable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_search_accounts_receivable_id_fkey"
            columns: ["accounts_receivable_id"]
            isOneToOne: true
            referencedRelation: "analytics_receivable_open_fact"
            referencedColumns: ["receivable_id"]
          },
        ]
      }
      activation: {
        Row: {
          attempt: number
          attempt_count: number
          billing_session_id: string
          completed_at: string | null
          correlation_id: string | null
          created_at: string
          failed_at: string | null
          failure_reason: string | null
          gateway_event_id: string | null
          id: string
          idempotency_key: string
          last_error_code: string | null
          last_error_message: string | null
          next_retry_at: string | null
          onboarding_session_id: string
          public_id: string
          started_at: string | null
          status: string
          subscription_intent_id: string
          updated_at: string
        }
        Insert: {
          attempt?: number
          attempt_count?: number
          billing_session_id: string
          completed_at?: string | null
          correlation_id?: string | null
          created_at?: string
          failed_at?: string | null
          failure_reason?: string | null
          gateway_event_id?: string | null
          id?: string
          idempotency_key: string
          last_error_code?: string | null
          last_error_message?: string | null
          next_retry_at?: string | null
          onboarding_session_id: string
          public_id?: string
          started_at?: string | null
          status?: string
          subscription_intent_id: string
          updated_at?: string
        }
        Update: {
          attempt?: number
          attempt_count?: number
          billing_session_id?: string
          completed_at?: string | null
          correlation_id?: string | null
          created_at?: string
          failed_at?: string | null
          failure_reason?: string | null
          gateway_event_id?: string | null
          id?: string
          idempotency_key?: string
          last_error_code?: string | null
          last_error_message?: string | null
          next_retry_at?: string | null
          onboarding_session_id?: string
          public_id?: string
          started_at?: string | null
          status?: string
          subscription_intent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activation_billing_session_id_fkey"
            columns: ["billing_session_id"]
            isOneToOne: true
            referencedRelation: "billing_session"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activation_onboarding_session_id_fkey"
            columns: ["onboarding_session_id"]
            isOneToOne: false
            referencedRelation: "onboarding_session"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activation_subscription_intent_id_fkey"
            columns: ["subscription_intent_id"]
            isOneToOne: true
            referencedRelation: "subscription_intent"
            referencedColumns: ["id"]
          },
        ]
      }
      activation_event: {
        Row: {
          activation_id: string
          created_at: string
          event_type: string
          id: string
          payload: Json
        }
        Insert: {
          activation_id: string
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
        }
        Update: {
          activation_id?: string
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "activation_event_activation_id_fkey"
            columns: ["activation_id"]
            isOneToOne: false
            referencedRelation: "activation"
            referencedColumns: ["id"]
          },
        ]
      }
      attribute_definition: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          created_by: string
          id: string
          is_filterable: boolean
          is_variant_axis: boolean
          name: string
          normalized_name: string
          organization_id: string
          sort_order: number
          status: string
          updated_at: string
          updated_by: string
          value_type: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_filterable?: boolean
          is_variant_axis?: boolean
          name: string
          normalized_name: string
          organization_id: string
          sort_order?: number
          status?: string
          updated_at?: string
          updated_by: string
          value_type: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_filterable?: boolean
          is_variant_axis?: boolean
          name?: string
          normalized_name?: string
          organization_id?: string
          sort_order?: number
          status?: string
          updated_at?: string
          updated_by?: string
          value_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "attribute_definition_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      attribute_option: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          created_by: string
          definition_id: string
          id: string
          label: string
          normalized_label: string
          sort_order: number
          status: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by: string
          definition_id: string
          id?: string
          label: string
          normalized_label: string
          sort_order?: number
          status?: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string
          definition_id?: string
          id?: string
          label?: string
          normalized_label?: string
          sort_order?: number
          status?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "attribute_option_definition_id_fkey"
            columns: ["definition_id"]
            isOneToOne: false
            referencedRelation: "attribute_definition"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_event: {
        Row: {
          action: string
          actor_type: string
          actor_user_id: string | null
          after_state: Json | null
          aggregate_id: string | null
          aggregate_type: string
          before_state: Json | null
          correlation_id: string | null
          created_at: string
          id: string
          organization_id: string | null
          payload: Json
          reason: string | null
        }
        Insert: {
          action: string
          actor_type?: string
          actor_user_id?: string | null
          after_state?: Json | null
          aggregate_id?: string | null
          aggregate_type: string
          before_state?: Json | null
          correlation_id?: string | null
          created_at?: string
          id?: string
          organization_id?: string | null
          payload?: Json
          reason?: string | null
        }
        Update: {
          action?: string
          actor_type?: string
          actor_user_id?: string | null
          after_state?: Json | null
          aggregate_id?: string | null
          aggregate_type?: string
          before_state?: Json | null
          correlation_id?: string | null
          created_at?: string
          id?: string
          organization_id?: string | null
          payload?: Json
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_event_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_event_inbox: {
        Row: {
          billing_session_id: string | null
          correlation_id: string
          error_code: string | null
          event_type: string
          external_event_id: string
          failed_at: string | null
          gateway: string
          id: string
          payload: Json
          payload_hash: string
          processed_at: string | null
          received_at: string
          status: string
        }
        Insert: {
          billing_session_id?: string | null
          correlation_id?: string
          error_code?: string | null
          event_type: string
          external_event_id: string
          failed_at?: string | null
          gateway: string
          id?: string
          payload?: Json
          payload_hash: string
          processed_at?: string | null
          received_at?: string
          status?: string
        }
        Update: {
          billing_session_id?: string | null
          correlation_id?: string
          error_code?: string | null
          event_type?: string
          external_event_id?: string
          failed_at?: string | null
          gateway?: string
          id?: string
          payload?: Json
          payload_hash?: string
          processed_at?: string | null
          received_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_event_inbox_billing_session_id_fkey"
            columns: ["billing_session_id"]
            isOneToOne: false
            referencedRelation: "billing_session"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_session: {
        Row: {
          checkout_url: string | null
          correlation_id: string | null
          created_at: string
          expires_at: string | null
          gateway: string
          gateway_reference: string | null
          id: string
          idempotency_key: string
          public_id: string
          status: string
          subscription_intent_id: string
          updated_at: string
        }
        Insert: {
          checkout_url?: string | null
          correlation_id?: string | null
          created_at?: string
          expires_at?: string | null
          gateway: string
          gateway_reference?: string | null
          id?: string
          idempotency_key: string
          public_id?: string
          status?: string
          subscription_intent_id: string
          updated_at?: string
        }
        Update: {
          checkout_url?: string | null
          correlation_id?: string | null
          created_at?: string
          expires_at?: string | null
          gateway?: string
          gateway_reference?: string | null
          id?: string
          idempotency_key?: string
          public_id?: string
          status?: string
          subscription_intent_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_session_subscription_intent_id_fkey"
            columns: ["subscription_intent_id"]
            isOneToOne: false
            referencedRelation: "subscription_intent"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_webhook_event: {
        Row: {
          billing_session_id: string | null
          event_type: string
          external_event_id: string
          gateway: string
          id: string
          payload: Json
          processed_at: string | null
          received_at: string
          signature_verified: boolean
        }
        Insert: {
          billing_session_id?: string | null
          event_type: string
          external_event_id: string
          gateway: string
          id?: string
          payload?: Json
          processed_at?: string | null
          received_at?: string
          signature_verified: boolean
        }
        Update: {
          billing_session_id?: string | null
          event_type?: string
          external_event_id?: string
          gateway?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          received_at?: string
          signature_verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "billing_webhook_event_billing_session_id_fkey"
            columns: ["billing_session_id"]
            isOneToOne: false
            referencedRelation: "billing_session"
            referencedColumns: ["id"]
          },
        ]
      }
      branch: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          code: string
          created_at: string
          created_by: string
          id: string
          is_default: boolean
          name: string
          organization_id: string
          status: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          code: string
          created_at?: string
          created_by: string
          id?: string
          is_default?: boolean
          name: string
          organization_id: string
          status?: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          code?: string
          created_at?: string
          created_by?: string
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_history: {
        Row: {
          action: string
          actor_user_id: string
          branch_id: string
          created_at: string
          details: Json
          id: string
          organization_id: string
        }
        Insert: {
          action: string
          actor_user_id: string
          branch_id: string
          created_at?: string
          details?: Json
          id?: string
          organization_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          branch_id?: string
          created_at?: string
          details?: Json
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_history_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      brand: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          normalized_name: string
          organization_id: string
          slug: string
          sort_order: number
          status: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          normalized_name: string
          organization_id: string
          slug: string
          sort_order?: number
          status?: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          normalized_name?: string
          organization_id?: string
          slug?: string
          sort_order?: number
          status?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      business_identity: {
        Row: {
          created_at: string
          id: string
          legal_name: string
          onboarding_id: string
          onboarding_session_id: string
          tax_id: string | null
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          legal_name: string
          onboarding_id: string
          onboarding_session_id: string
          tax_id?: string | null
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          legal_name?: string
          onboarding_id?: string
          onboarding_session_id?: string
          tax_id?: string | null
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_identity_onboarding_session_id_fkey"
            columns: ["onboarding_session_id"]
            isOneToOne: true
            referencedRelation: "onboarding_session"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_account: {
        Row: {
          account_type: string
          branch_id: string | null
          code: string
          company_id: string | null
          created_at: string
          created_by: string
          id: string
          name: string
          organization_id: string
          status: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          account_type: string
          branch_id?: string | null
          code: string
          company_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          name: string
          organization_id: string
          status?: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          account_type?: string
          branch_id?: string | null
          code?: string
          company_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_account_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_account_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_account_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_entry: {
        Row: {
          account_id: string
          amount: number
          branch_id: string | null
          company_id: string | null
          correlation_id: string | null
          created_at: string
          created_by: string
          description: string
          entry_type: string
          id: string
          ledger_idempotency_key: string | null
          number: string
          occurred_at: string
          organization_id: string
          origin: string
          payment_id: string | null
          post_idempotency_key: string | null
          reversal_of_entry_id: string | null
          source_document: string | null
          source_id: string | null
          status: string
          transfer_id: string | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          account_id: string
          amount: number
          branch_id?: string | null
          company_id?: string | null
          correlation_id?: string | null
          created_at?: string
          created_by: string
          description: string
          entry_type: string
          id?: string
          ledger_idempotency_key?: string | null
          number: string
          occurred_at?: string
          organization_id: string
          origin: string
          payment_id?: string | null
          post_idempotency_key?: string | null
          reversal_of_entry_id?: string | null
          source_document?: string | null
          source_id?: string | null
          status?: string
          transfer_id?: string | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          account_id?: string
          amount?: number
          branch_id?: string | null
          company_id?: string | null
          correlation_id?: string | null
          created_at?: string
          created_by?: string
          description?: string
          entry_type?: string
          id?: string
          ledger_idempotency_key?: string | null
          number?: string
          occurred_at?: string
          organization_id?: string
          origin?: string
          payment_id?: string | null
          post_idempotency_key?: string | null
          reversal_of_entry_id?: string | null
          source_document?: string | null
          source_id?: string | null
          status?: string
          transfer_id?: string | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_entry_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "cash_account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_entry_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_entry_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_entry_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_entry_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_entry_reversal_of_entry_id_fkey"
            columns: ["reversal_of_entry_id"]
            isOneToOne: false
            referencedRelation: "analytics_cash_ledger_fact"
            referencedColumns: ["cash_ledger_entry_id"]
          },
          {
            foreignKeyName: "cash_entry_reversal_of_entry_id_fkey"
            columns: ["reversal_of_entry_id"]
            isOneToOne: false
            referencedRelation: "cash_entry"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_entry_counter: {
        Row: {
          last_value: number
          organization_id: string
        }
        Insert: {
          last_value?: number
          organization_id: string
        }
        Update: {
          last_value?: number
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_entry_counter_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_entry_history: {
        Row: {
          action: string
          actor_user_id: string
          cash_entry_id: string
          created_at: string
          details: Json
          id: string
          organization_id: string
        }
        Insert: {
          action: string
          actor_user_id: string
          cash_entry_id: string
          created_at?: string
          details?: Json
          id?: string
          organization_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          cash_entry_id?: string
          created_at?: string
          details?: Json
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_entry_history_cash_entry_id_fkey"
            columns: ["cash_entry_id"]
            isOneToOne: false
            referencedRelation: "analytics_cash_ledger_fact"
            referencedColumns: ["cash_ledger_entry_id"]
          },
          {
            foreignKeyName: "cash_entry_history_cash_entry_id_fkey"
            columns: ["cash_entry_id"]
            isOneToOne: false
            referencedRelation: "cash_entry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_entry_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flow_search: {
        Row: {
          account_id: string
          amount: number
          branch_id: string | null
          cash_entry_id: string
          company_id: string | null
          customer_name: string | null
          entry_type: string
          number: string
          occurred_at: string
          organization_id: string
          origin: string
          payment_reference: string | null
          receivable_id: string | null
          search_text: string
          settlement_date: string | null
          source_document: string | null
          source_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          account_id: string
          amount: number
          branch_id?: string | null
          cash_entry_id: string
          company_id?: string | null
          customer_name?: string | null
          entry_type: string
          number: string
          occurred_at: string
          organization_id: string
          origin: string
          payment_reference?: string | null
          receivable_id?: string | null
          search_text?: string
          settlement_date?: string | null
          source_document?: string | null
          source_id?: string | null
          status: string
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount?: number
          branch_id?: string | null
          cash_entry_id?: string
          company_id?: string | null
          customer_name?: string | null
          entry_type?: string
          number?: string
          occurred_at?: string
          organization_id?: string
          origin?: string
          payment_reference?: string | null
          receivable_id?: string | null
          search_text?: string
          settlement_date?: string | null
          source_document?: string | null
          source_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_flow_search_cash_entry_id_fkey"
            columns: ["cash_entry_id"]
            isOneToOne: true
            referencedRelation: "analytics_cash_ledger_fact"
            referencedColumns: ["cash_ledger_entry_id"]
          },
          {
            foreignKeyName: "cash_flow_search_cash_entry_id_fkey"
            columns: ["cash_entry_id"]
            isOneToOne: true
            referencedRelation: "cash_entry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_flow_search_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_history: {
        Row: {
          actor_user_id: string
          entity_id: string
          entity_type: string
          event_type: string
          id: string
          occurred_at: string
          organization_id: string
          payload: Json
        }
        Insert: {
          actor_user_id: string
          entity_id: string
          entity_type: string
          event_type: string
          id?: string
          occurred_at?: string
          organization_id: string
          payload?: Json
        }
        Update: {
          actor_user_id?: string
          entity_id?: string
          entity_type?: string
          event_type?: string
          id?: string
          occurred_at?: string
          organization_id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "catalog_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_product_lifecycle_event: {
        Row: {
          action: string
          actor_user_id: string
          from_status: string
          id: string
          occurred_at: string
          organization_id: string
          product_id: string
          reason: string | null
          to_status: string
        }
        Insert: {
          action: string
          actor_user_id: string
          from_status: string
          id?: string
          occurred_at?: string
          organization_id: string
          product_id: string
          reason?: string | null
          to_status: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          from_status?: string
          id?: string
          occurred_at?: string
          organization_id?: string
          product_id?: string
          reason?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_product_lifecycle_event_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_product_lifecycle_event_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_product_fact"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "catalog_product_lifecycle_event_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_search_projection: {
        Row: {
          attributes: Json
          barcodes: string[]
          brand_id: string | null
          brand_name: string | null
          category_id: string | null
          category_name: string | null
          organization_id: string
          product_id: string
          product_name: string
          product_status: string
          search_text: string
          sku: string | null
          updated_at: string
          variant_id: string
          variant_name: string
          variant_status: string
        }
        Insert: {
          attributes?: Json
          barcodes?: string[]
          brand_id?: string | null
          brand_name?: string | null
          category_id?: string | null
          category_name?: string | null
          organization_id: string
          product_id: string
          product_name: string
          product_status: string
          search_text: string
          sku?: string | null
          updated_at?: string
          variant_id: string
          variant_name: string
          variant_status: string
        }
        Update: {
          attributes?: Json
          barcodes?: string[]
          brand_id?: string | null
          brand_name?: string | null
          category_id?: string | null
          category_name?: string | null
          organization_id?: string
          product_id?: string
          product_name?: string
          product_status?: string
          search_text?: string
          sku?: string | null
          updated_at?: string
          variant_id?: string
          variant_name?: string
          variant_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_search_projection_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_search_projection_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_product_fact"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "catalog_search_projection_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalog_search_projection_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: true
            referencedRelation: "product_variant"
            referencedColumns: ["id"]
          },
        ]
      }
      category: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          created_by: string
          depth: number
          description: string | null
          id: string
          name: string
          normalized_name: string
          organization_id: string
          parent_id: string | null
          slug: string
          sort_order: number
          status: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by: string
          depth?: number
          description?: string | null
          id?: string
          name: string
          normalized_name: string
          organization_id: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          status?: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string
          depth?: number
          description?: string | null
          id?: string
          name?: string
          normalized_name?: string
          organization_id?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          status?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_history: {
        Row: {
          action: string
          actor_user_id: string | null
          checkout_id: string
          created_at: string
          id: string
          new_status: string | null
          old_status: string | null
          reason: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          checkout_id: string
          created_at?: string
          id?: string
          new_status?: string | null
          old_status?: string | null
          reason?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          checkout_id?: string
          created_at?: string
          id?: string
          new_status?: string | null
          old_status?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkout_history_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "checkout_session"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_search: {
        Row: {
          billing_cycle: string
          checkout_id: string
          expires_at: string
          organization_name: string | null
          owner_email: string | null
          owner_name: string | null
          public_token: string
          search_text: string
          selected_plan: string
          status: string
          updated_at: string
        }
        Insert: {
          billing_cycle: string
          checkout_id: string
          expires_at: string
          organization_name?: string | null
          owner_email?: string | null
          owner_name?: string | null
          public_token: string
          search_text: string
          selected_plan: string
          status: string
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          checkout_id?: string
          expires_at?: string
          organization_name?: string | null
          owner_email?: string | null
          owner_name?: string | null
          public_token?: string
          search_text?: string
          selected_plan?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checkout_search_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: true
            referencedRelation: "checkout_session"
            referencedColumns: ["id"]
          },
        ]
      }
      checkout_session: {
        Row: {
          billing_cycle: string
          cancelled_at: string | null
          completed_at: string | null
          country: string
          created_at: string
          currency: string
          expires_at: string
          failed_reason: string | null
          id: string
          language: string
          organization_name: string | null
          organization_slug: string | null
          owner_email: string | null
          owner_name: string | null
          phone: string | null
          public_token: string
          selected_plan: string
          status: string
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle: string
          cancelled_at?: string | null
          completed_at?: string | null
          country?: string
          created_at?: string
          currency?: string
          expires_at?: string
          failed_reason?: string | null
          id?: string
          language?: string
          organization_name?: string | null
          organization_slug?: string | null
          owner_email?: string | null
          owner_name?: string | null
          phone?: string | null
          public_token?: string
          selected_plan: string
          status?: string
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          cancelled_at?: string | null
          completed_at?: string | null
          country?: string
          created_at?: string
          currency?: string
          expires_at?: string
          failed_reason?: string | null
          id?: string
          language?: string
          organization_name?: string | null
          organization_slug?: string | null
          owner_email?: string | null
          owner_name?: string | null
          phone?: string | null
          public_token?: string
          selected_plan?: string
          status?: string
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customer: {
        Row: {
          acquisition_source_id: string | null
          acquisition_source_other: string | null
          archived_at: string | null
          archived_by: string | null
          birth_day: number | null
          birth_month: number | null
          branch_id: string
          city: string | null
          commercial_phone: string | null
          company_id: string
          created_at: string
          created_by: string
          document: string | null
          email: string | null
          gender: string | null
          id: string
          instagram: string | null
          legal_representative: string | null
          municipal_registration: string | null
          name: string
          notes: string | null
          organization_id: string
          person_type: string
          phone: string | null
          rg: string | null
          secondary_phone: string | null
          short_name: string
          state_registration: string | null
          status: string
          trade_name: string | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          acquisition_source_id?: string | null
          acquisition_source_other?: string | null
          archived_at?: string | null
          archived_by?: string | null
          birth_day?: number | null
          birth_month?: number | null
          branch_id: string
          city?: string | null
          commercial_phone?: string | null
          company_id: string
          created_at?: string
          created_by: string
          document?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          instagram?: string | null
          legal_representative?: string | null
          municipal_registration?: string | null
          name: string
          notes?: string | null
          organization_id: string
          person_type: string
          phone?: string | null
          rg?: string | null
          secondary_phone?: string | null
          short_name: string
          state_registration?: string | null
          status?: string
          trade_name?: string | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          acquisition_source_id?: string | null
          acquisition_source_other?: string | null
          archived_at?: string | null
          archived_by?: string | null
          birth_day?: number | null
          birth_month?: number | null
          branch_id?: string
          city?: string | null
          commercial_phone?: string | null
          company_id?: string
          created_at?: string
          created_by?: string
          document?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          instagram?: string | null
          legal_representative?: string | null
          municipal_registration?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          person_type?: string
          phone?: string | null
          rg?: string | null
          secondary_phone?: string | null
          short_name?: string
          state_registration?: string | null
          status?: string
          trade_name?: string | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_acquisition_source_fk"
            columns: ["acquisition_source_id"]
            isOneToOne: false
            referencedRelation: "customer_acquisition_source"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_acquisition_source: {
        Row: {
          archived_at: string | null
          code: string
          created_at: string
          created_by: string
          id: string
          name: string
          organization_id: string
          status: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          code: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          organization_id: string
          status?: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          code?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_acquisition_source_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_address: {
        Row: {
          archived_at: string | null
          city: string
          complement: string | null
          country: string
          created_at: string
          created_by: string
          customer_id: string
          district: string | null
          id: string
          is_primary: boolean
          kind: string
          number: string | null
          organization_id: string
          postal_code: string
          state: string
          status: string
          street: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          city: string
          complement?: string | null
          country?: string
          created_at?: string
          created_by: string
          customer_id: string
          district?: string | null
          id?: string
          is_primary?: boolean
          kind: string
          number?: string | null
          organization_id: string
          postal_code: string
          state: string
          status?: string
          street: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          city?: string
          complement?: string | null
          country?: string
          created_at?: string
          created_by?: string
          customer_id?: string
          district?: string | null
          id?: string
          is_primary?: boolean
          kind?: string
          number?: string | null
          organization_id?: string
          postal_code?: string
          state?: string
          status?: string
          street?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_address_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "analytics_customer_fact"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_address_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_address_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_contact: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string
          customer_id: string
          email: string | null
          id: string
          is_primary: boolean
          name: string
          organization_id: string
          phone: string | null
          role_title: string | null
          status: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by: string
          customer_id: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name: string
          organization_id: string
          phone?: string | null
          role_title?: string | null
          status?: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string
          customer_id?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name?: string
          organization_id?: string
          phone?: string | null
          role_title?: string | null
          status?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_contact_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "analytics_customer_fact"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_contact_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_contact_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_dependent: {
        Row: {
          archived_at: string | null
          birth_day: number | null
          birth_month: number | null
          branch_id: string
          company_id: string
          created_at: string
          created_by: string
          customer_id: string
          full_name: string
          id: string
          notes: string | null
          organization_id: string
          relationship: string | null
          status: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          birth_day?: number | null
          birth_month?: number | null
          branch_id: string
          company_id: string
          created_at?: string
          created_by: string
          customer_id: string
          full_name: string
          id?: string
          notes?: string | null
          organization_id: string
          relationship?: string | null
          status?: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          birth_day?: number | null
          birth_month?: number | null
          branch_id?: string
          company_id?: string
          created_at?: string
          created_by?: string
          customer_id?: string
          full_name?: string
          id?: string
          notes?: string | null
          organization_id?: string
          relationship?: string | null
          status?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_dependent_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_dependent_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_dependent_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "analytics_customer_fact"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_dependent_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_dependent_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_history: {
        Row: {
          action: string
          actor_ip: string | null
          actor_user_id: string
          created_at: string
          customer_id: string
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
          organization_id: string
          reason: string | null
        }
        Insert: {
          action: string
          actor_ip?: string | null
          actor_user_id: string
          created_at?: string
          customer_id: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id: string
          reason?: string | null
        }
        Update: {
          action?: string
          actor_ip?: string | null
          actor_user_id?: string
          created_at?: string
          customer_id?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_history_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "analytics_customer_fact"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_history_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_search: {
        Row: {
          city: string | null
          customer_id: string
          document_digits: string | null
          email: string | null
          instagram: string | null
          legal_name: string
          organization_id: string
          phone: string | null
          search_text: string
          short_name: string | null
          status: string
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          customer_id: string
          document_digits?: string | null
          email?: string | null
          instagram?: string | null
          legal_name: string
          organization_id: string
          phone?: string | null
          search_text?: string
          short_name?: string | null
          status: string
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          customer_id?: string
          document_digits?: string | null
          email?: string | null
          instagram?: string | null
          legal_name?: string
          organization_id?: string
          phone?: string | null
          search_text?: string
          short_name?: string | null
          status?: string
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_search_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "analytics_customer_fact"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "customer_search_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_search_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_outbox: {
        Row: {
          aggregate_id: string
          aggregate_type: string
          attempt_count: number
          available_at: string
          correlation_id: string
          event_type: string
          failed_at: string | null
          id: string
          last_error_code: string | null
          last_error_message: string | null
          locked_at: string | null
          locked_by: string | null
          occurred_at: string
          payload: Json
          published_at: string | null
          status: string
        }
        Insert: {
          aggregate_id: string
          aggregate_type: string
          attempt_count?: number
          available_at?: string
          correlation_id: string
          event_type: string
          failed_at?: string | null
          id?: string
          last_error_code?: string | null
          last_error_message?: string | null
          locked_at?: string | null
          locked_by?: string | null
          occurred_at?: string
          payload?: Json
          published_at?: string | null
          status?: string
        }
        Update: {
          aggregate_id?: string
          aggregate_type?: string
          attempt_count?: number
          available_at?: string
          correlation_id?: string
          event_type?: string
          failed_at?: string | null
          id?: string
          last_error_code?: string | null
          last_error_message?: string | null
          locked_at?: string | null
          locked_by?: string | null
          occurred_at?: string
          payload?: Json
          published_at?: string | null
          status?: string
        }
        Relationships: []
      }
      entitlement_definition: {
        Row: {
          created_at: string
          description: string
          key: string
          type: string
        }
        Insert: {
          created_at?: string
          description: string
          key: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string
          key?: string
          type?: string
        }
        Relationships: []
      }
      feature_flag: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          key: string
          organization_id: string | null
          payload: Json
          scope: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          key: string
          organization_id?: string | null
          payload?: Json
          scope: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          key?: string
          organization_id?: string | null
          payload?: Json
          scope?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_flag_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_account: {
        Row: {
          active: boolean
          created_at: string
          created_by: string
          id: string
          name: string
          organization_id: string
          type: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by: string
          id?: string
          name: string
          organization_id: string
          type: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          organization_id?: string
          type?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_account_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transfer: {
        Row: {
          amount: number
          company_id: string
          correlation_id: string
          created_at: string
          created_by: string
          destination_cash_account_id: string
          id: string
          idempotency_key: string
          occurred_at: string
          organization_id: string
          reference: string | null
          source_cash_account_id: string
        }
        Insert: {
          amount: number
          company_id: string
          correlation_id?: string
          created_at?: string
          created_by: string
          destination_cash_account_id: string
          id?: string
          idempotency_key: string
          occurred_at?: string
          organization_id: string
          reference?: string | null
          source_cash_account_id: string
        }
        Update: {
          amount?: number
          company_id?: string
          correlation_id?: string
          created_at?: string
          created_by?: string
          destination_cash_account_id?: string
          id?: string
          idempotency_key?: string
          occurred_at?: string
          organization_id?: string
          reference?: string | null
          source_cash_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transfer_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transfer_destination_cash_account_id_fkey"
            columns: ["destination_cash_account_id"]
            isOneToOne: false
            referencedRelation: "cash_account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transfer_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transfer_source_cash_account_id_fkey"
            columns: ["source_cash_account_id"]
            isOneToOne: false
            referencedRelation: "cash_account"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_classification: {
        Row: {
          created_at: string
          created_by: string
          id: string
          organization_id: string
          tax_profile_id: string
          updated_at: string
          updated_by: string
          variant_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          organization_id: string
          tax_profile_id: string
          updated_at?: string
          updated_by: string
          variant_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
          tax_profile_id?: string
          updated_at?: string
          updated_by?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_classification_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_classification_tax_profile_id_fkey"
            columns: ["tax_profile_id"]
            isOneToOne: false
            referencedRelation: "tax_profile"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_classification_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variant"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_document: {
        Row: {
          created_at: string
          created_by: string
          document_type: string
          id: string
          internal_number: string
          occurred_at: string
          operation_id: string
          organization_id: string
          responsible_user_id: string
          source_document: string | null
          source_id: string | null
          source_type: string | null
          status: string
          tax_profile_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          document_type: string
          id?: string
          internal_number: string
          occurred_at?: string
          operation_id: string
          organization_id: string
          responsible_user_id: string
          source_document?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          tax_profile_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          document_type?: string
          id?: string
          internal_number?: string
          occurred_at?: string
          operation_id?: string
          organization_id?: string
          responsible_user_id?: string
          source_document?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          tax_profile_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_document_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "fiscal_operation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_document_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_document_tax_profile_id_fkey"
            columns: ["tax_profile_id"]
            isOneToOne: false
            referencedRelation: "tax_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_document_history: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string
          fiscal_document_id: string
          id: string
          organization_id: string
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string
          fiscal_document_id: string
          id?: string
          organization_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string
          fiscal_document_id?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_document_history_fiscal_document_id_fkey"
            columns: ["fiscal_document_id"]
            isOneToOne: false
            referencedRelation: "fiscal_document"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_document_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_document_item: {
        Row: {
          cfop: string | null
          created_at: string
          created_by: string
          csosn: string | null
          cst: string | null
          fiscal_document_id: string
          id: string
          ncm: string | null
          organization_id: string
          origin: string | null
          quantity: number
          unit_code: string
          variant_id: string
          variant_snapshot: Json
        }
        Insert: {
          cfop?: string | null
          created_at?: string
          created_by: string
          csosn?: string | null
          cst?: string | null
          fiscal_document_id: string
          id?: string
          ncm?: string | null
          organization_id: string
          origin?: string | null
          quantity: number
          unit_code: string
          variant_id: string
          variant_snapshot: Json
        }
        Update: {
          cfop?: string | null
          created_at?: string
          created_by?: string
          csosn?: string | null
          cst?: string | null
          fiscal_document_id?: string
          id?: string
          ncm?: string | null
          organization_id?: string
          origin?: string | null
          quantity?: number
          unit_code?: string
          variant_id?: string
          variant_snapshot?: Json
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_document_item_fiscal_document_id_fkey"
            columns: ["fiscal_document_id"]
            isOneToOne: false
            referencedRelation: "fiscal_document"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_document_item_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_document_item_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variant"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_document_search: {
        Row: {
          customer_name: string | null
          document_type: string
          fiscal_document_id: string
          internal_number: string
          item_count: number | null
          operation_id: string
          organization_id: string
          sales_order_id: string | null
          sales_order_number: string | null
          search_text: string
          source_document: string | null
          source_id: string | null
          source_type: string | null
          status: string
          tax_profile_id: string
          updated_at: string
        }
        Insert: {
          customer_name?: string | null
          document_type: string
          fiscal_document_id: string
          internal_number: string
          item_count?: number | null
          operation_id: string
          organization_id: string
          sales_order_id?: string | null
          sales_order_number?: string | null
          search_text?: string
          source_document?: string | null
          source_id?: string | null
          source_type?: string | null
          status: string
          tax_profile_id: string
          updated_at?: string
        }
        Update: {
          customer_name?: string | null
          document_type?: string
          fiscal_document_id?: string
          internal_number?: string
          item_count?: number | null
          operation_id?: string
          organization_id?: string
          sales_order_id?: string | null
          sales_order_number?: string | null
          search_text?: string
          source_document?: string | null
          source_id?: string | null
          source_type?: string | null
          status?: string
          tax_profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_document_search_fiscal_document_id_fkey"
            columns: ["fiscal_document_id"]
            isOneToOne: true
            referencedRelation: "fiscal_document"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_document_search_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_operation: {
        Row: {
          cfop: string | null
          code: string
          created_at: string
          created_by: string
          id: string
          name: string
          operation_type: string
          organization_id: string
          status: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          cfop?: string | null
          code: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          operation_type: string
          organization_id: string
          status?: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          cfop?: string | null
          code?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          operation_type?: string
          organization_id?: string
          status?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_operation_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_rule: {
        Row: {
          cfop: string | null
          created_at: string
          created_by: string
          csosn: string | null
          cst: string | null
          destination_state: string
          id: string
          operation_id: string
          organization_id: string
          origin_state: string
          status: string
          tax_profile_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          cfop?: string | null
          created_at?: string
          created_by: string
          csosn?: string | null
          cst?: string | null
          destination_state: string
          id?: string
          operation_id: string
          organization_id: string
          origin_state: string
          status?: string
          tax_profile_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          cfop?: string | null
          created_at?: string
          created_by?: string
          csosn?: string | null
          cst?: string | null
          destination_state?: string
          id?: string
          operation_id?: string
          organization_id?: string
          origin_state?: string
          status?: string
          tax_profile_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_rule_operation_id_fkey"
            columns: ["operation_id"]
            isOneToOne: false
            referencedRelation: "fiscal_operation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_rule_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_rule_tax_profile_id_fkey"
            columns: ["tax_profile_id"]
            isOneToOne: false
            referencedRelation: "tax_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_search: {
        Row: {
          code: string | null
          entity_id: string
          entity_type: string
          id: string
          name: string | null
          operation_id: string | null
          operation_type: string | null
          organization_id: string
          profile_code: string | null
          search_text: string
          state_destination: string | null
          state_origin: string | null
          tax_profile_id: string | null
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          code?: string | null
          entity_id: string
          entity_type: string
          id?: string
          name?: string | null
          operation_id?: string | null
          operation_type?: string | null
          organization_id: string
          profile_code?: string | null
          search_text?: string
          state_destination?: string | null
          state_origin?: string | null
          tax_profile_id?: string | null
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          code?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          name?: string | null
          operation_id?: string | null
          operation_type?: string | null
          organization_id?: string
          profile_code?: string | null
          search_text?: string
          state_destination?: string | null
          state_origin?: string | null
          tax_profile_id?: string | null
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_search_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_source_metadata: {
        Row: {
          created_at: string
          created_by: string
          destination_state: string
          fiscal_date: string
          fiscal_operation_id: string
          id: string
          metadata: Json
          organization_id: string
          origin_state: string
          responsible_user_id: string
          source_id: string
          source_number: string
          source_type: string
          status: string
          supersedes_id: string | null
          tax_profile_id: string
          updated_at: string
          updated_by: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by: string
          destination_state: string
          fiscal_date: string
          fiscal_operation_id: string
          id?: string
          metadata?: Json
          organization_id: string
          origin_state: string
          responsible_user_id: string
          source_id: string
          source_number: string
          source_type: string
          status?: string
          supersedes_id?: string | null
          tax_profile_id: string
          updated_at?: string
          updated_by: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          destination_state?: string
          fiscal_date?: string
          fiscal_operation_id?: string
          id?: string
          metadata?: Json
          organization_id?: string
          origin_state?: string
          responsible_user_id?: string
          source_id?: string
          source_number?: string
          source_type?: string
          status?: string
          supersedes_id?: string | null
          tax_profile_id?: string
          updated_at?: string
          updated_by?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_source_metadata_fiscal_operation_id_fkey"
            columns: ["fiscal_operation_id"]
            isOneToOne: false
            referencedRelation: "fiscal_operation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_source_metadata_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_source_metadata_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "fiscal_source_metadata"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_source_metadata_tax_profile_id_fkey"
            columns: ["tax_profile_id"]
            isOneToOne: false
            referencedRelation: "tax_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_source_metadata_history: {
        Row: {
          action: string
          actor_user_id: string
          changed_fields: Json
          created_at: string
          id: string
          metadata_id: string
          organization_id: string
          validation_errors: Json
        }
        Insert: {
          action: string
          actor_user_id: string
          changed_fields?: Json
          created_at?: string
          id?: string
          metadata_id: string
          organization_id: string
          validation_errors?: Json
        }
        Update: {
          action?: string
          actor_user_id?: string
          changed_fields?: Json
          created_at?: string
          id?: string
          metadata_id?: string
          organization_id?: string
          validation_errors?: Json
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_source_metadata_history_metadata_id_fkey"
            columns: ["metadata_id"]
            isOneToOne: false
            referencedRelation: "fiscal_source_metadata"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_source_metadata_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      fiscal_source_metadata_search: {
        Row: {
          created_at: string
          destination_state: string
          fiscal_date: string
          fiscal_operation_id: string
          metadata_id: string
          metadata_status: string
          organization_id: string
          origin_state: string
          responsible_user_id: string
          search_text: string
          source_id: string
          source_number: string
          source_type: string
          tax_profile_id: string
          updated_at: string
        }
        Insert: {
          created_at: string
          destination_state: string
          fiscal_date: string
          fiscal_operation_id: string
          metadata_id: string
          metadata_status: string
          organization_id: string
          origin_state: string
          responsible_user_id: string
          search_text?: string
          source_id: string
          source_number: string
          source_type: string
          tax_profile_id: string
          updated_at: string
        }
        Update: {
          created_at?: string
          destination_state?: string
          fiscal_date?: string
          fiscal_operation_id?: string
          metadata_id?: string
          metadata_status?: string
          organization_id?: string
          origin_state?: string
          responsible_user_id?: string
          search_text?: string
          source_id?: string
          source_number?: string
          source_type?: string
          tax_profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_source_metadata_search_metadata_id_fkey"
            columns: ["metadata_id"]
            isOneToOne: true
            referencedRelation: "fiscal_source_metadata"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiscal_source_metadata_search_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      goods_receipt: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          created_by: string
          id: string
          location_id: string | null
          notes: string | null
          number: string
          organization_id: string
          post_idempotency_key: string | null
          previous_status: string | null
          purchase_number: string
          purchase_order_id: string
          received_at: string | null
          status: string
          supplier_document: string | null
          supplier_id: string
          supplier_legal_name: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by: string
          id?: string
          location_id?: string | null
          notes?: string | null
          number: string
          organization_id: string
          post_idempotency_key?: string | null
          previous_status?: string | null
          purchase_number: string
          purchase_order_id: string
          received_at?: string | null
          status?: string
          supplier_document?: string | null
          supplier_id: string
          supplier_legal_name: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string
          id?: string
          location_id?: string | null
          notes?: string | null
          number?: string
          organization_id?: string
          post_idempotency_key?: string | null
          previous_status?: string | null
          purchase_number?: string
          purchase_order_id?: string
          received_at?: string | null
          status?: string
          supplier_document?: string | null
          supplier_id?: string
          supplier_legal_name?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipt_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "stock_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
        ]
      }
      goods_receipt_history: {
        Row: {
          action: string
          actor_ip: string | null
          actor_user_id: string
          created_at: string
          field_name: string | null
          goods_receipt_id: string
          id: string
          new_value: string | null
          old_value: string | null
          organization_id: string
          reason: string | null
        }
        Insert: {
          action: string
          actor_ip?: string | null
          actor_user_id: string
          created_at?: string
          field_name?: string | null
          goods_receipt_id: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id: string
          reason?: string | null
        }
        Update: {
          action?: string
          actor_ip?: string | null
          actor_user_id?: string
          created_at?: string
          field_name?: string | null
          goods_receipt_id?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipt_history_goods_receipt_id_fkey"
            columns: ["goods_receipt_id"]
            isOneToOne: false
            referencedRelation: "goods_receipt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      goods_receipt_item: {
        Row: {
          created_at: string
          created_by: string
          divergence: string | null
          goods_receipt_id: string
          id: string
          ledger_movement_id: string | null
          location_id: string | null
          notes: string | null
          ordered_quantity: number
          organization_id: string
          purchase_item_id: string
          received_quantity: number
          returned_quantity: number
          sort_order: number
          unit_code: string
          updated_at: string
          updated_by: string
          variant_id: string
          variant_name: string
          variant_sku: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          divergence?: string | null
          goods_receipt_id: string
          id?: string
          ledger_movement_id?: string | null
          location_id?: string | null
          notes?: string | null
          ordered_quantity: number
          organization_id: string
          purchase_item_id: string
          received_quantity?: number
          returned_quantity?: number
          sort_order?: number
          unit_code: string
          updated_at?: string
          updated_by: string
          variant_id: string
          variant_name: string
          variant_sku?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          divergence?: string | null
          goods_receipt_id?: string
          id?: string
          ledger_movement_id?: string | null
          location_id?: string | null
          notes?: string | null
          ordered_quantity?: number
          organization_id?: string
          purchase_item_id?: string
          received_quantity?: number
          returned_quantity?: number
          sort_order?: number
          unit_code?: string
          updated_at?: string
          updated_by?: string
          variant_id?: string
          variant_name?: string
          variant_sku?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipt_item_goods_receipt_id_fkey"
            columns: ["goods_receipt_id"]
            isOneToOne: false
            referencedRelation: "goods_receipt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_item_ledger_movement_id_fkey"
            columns: ["ledger_movement_id"]
            isOneToOne: false
            referencedRelation: "inventory_ledger_movement"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_item_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "stock_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_item_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_item_purchase_item_id_fkey"
            columns: ["purchase_item_id"]
            isOneToOne: false
            referencedRelation: "purchase_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_item_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variant"
            referencedColumns: ["id"]
          },
        ]
      }
      goods_receipt_number_counter: {
        Row: {
          last_value: number
          organization_id: string
        }
        Insert: {
          last_value?: number
          organization_id: string
        }
        Update: {
          last_value?: number
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipt_number_counter_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      goods_receipt_search: {
        Row: {
          created_at: string
          goods_receipt_id: string
          number: string
          organization_id: string
          purchase_number: string
          received_at: string | null
          search_text: string
          status: string
          supplier_document: string | null
          supplier_legal_name: string
          updated_at: string
        }
        Insert: {
          created_at: string
          goods_receipt_id: string
          number: string
          organization_id: string
          purchase_number: string
          received_at?: string | null
          search_text?: string
          status: string
          supplier_document?: string | null
          supplier_legal_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          goods_receipt_id?: string
          number?: string
          organization_id?: string
          purchase_number?: string
          received_at?: string | null
          search_text?: string
          status?: string
          supplier_document?: string | null
          supplier_legal_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goods_receipt_search_goods_receipt_id_fkey"
            columns: ["goods_receipt_id"]
            isOneToOne: true
            referencedRelation: "goods_receipt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_receipt_search_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      initial_inventory_valuation: {
        Row: {
          branch_id: string
          created_at: string
          created_by: string
          currency: string
          id: string
          idempotency_key: string
          inventory_ledger_entry_id: string
          location_id: string
          occurred_at: string
          organization_id: string
          quantity: number
          source_id: string
          source_type: string
          total_cost: number | null
          unit_cost: number
          variant_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          created_by: string
          currency?: string
          id?: string
          idempotency_key: string
          inventory_ledger_entry_id: string
          location_id: string
          occurred_at: string
          organization_id: string
          quantity: number
          source_id: string
          source_type: string
          total_cost?: number | null
          unit_cost: number
          variant_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          created_by?: string
          currency?: string
          id?: string
          idempotency_key?: string
          inventory_ledger_entry_id?: string
          location_id?: string
          occurred_at?: string
          organization_id?: string
          quantity?: number
          source_id?: string
          source_type?: string
          total_cost?: number | null
          unit_cost?: number
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "initial_inventory_valuation_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initial_inventory_valuation_inventory_ledger_entry_id_fkey"
            columns: ["inventory_ledger_entry_id"]
            isOneToOne: true
            referencedRelation: "inventory_ledger_movement"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initial_inventory_valuation_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "stock_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initial_inventory_valuation_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "initial_inventory_valuation_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variant"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_balance: {
        Row: {
          organization_id: string
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          organization_id: string
          product_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          organization_id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_balance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_balance_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_product_fact"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_balance_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_item: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          created_by: string
          id: string
          location_id: string
          organization_id: string
          qty_on_hand: number
          qty_reserved: number
          status: string
          updated_at: string
          updated_by: string
          variant_id: string
          version: number
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by: string
          id?: string
          location_id: string
          organization_id: string
          qty_on_hand?: number
          qty_reserved?: number
          status?: string
          updated_at?: string
          updated_by: string
          variant_id: string
          version?: number
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string
          id?: string
          location_id?: string
          organization_id?: string
          qty_on_hand?: number
          qty_reserved?: number
          status?: string
          updated_at?: string
          updated_by?: string
          variant_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_item_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "stock_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_item_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_item_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variant"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_item_history: {
        Row: {
          field_name: string
          id: string
          inventory_item_id: string
          location_id: string
          new_value: string
          organization_id: string
          previous_value: string | null
          reason: string | null
          recorded_at: string
          recorded_by: string
          variant_id: string
        }
        Insert: {
          field_name: string
          id?: string
          inventory_item_id: string
          location_id: string
          new_value: string
          organization_id: string
          previous_value?: string | null
          reason?: string | null
          recorded_at?: string
          recorded_by: string
          variant_id: string
        }
        Update: {
          field_name?: string
          id?: string
          inventory_item_id?: string
          location_id?: string
          new_value?: string
          organization_id?: string
          previous_value?: string | null
          reason?: string | null
          recorded_at?: string
          recorded_by?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_item_history_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_preparation_fact"
            referencedColumns: ["inventory_item_id"]
          },
          {
            foreignKeyName: "inventory_item_history_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_item_history_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "stock_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_item_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_item_history_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variant"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_ledger_movement: {
        Row: {
          after_quantity: number
          before_quantity: number
          correlation_id: string | null
          created_at: string
          created_by: string
          id: string
          idempotency_key: string | null
          inventory_item_id: string
          location_id: string
          notes: string | null
          occurred_at: string
          organization_id: string
          quantity: number
          reason: string
          reference_id: string | null
          reference_type: string | null
          reverses_movement_id: string | null
          signed_delta: number
          type: string
          variant_id: string
        }
        Insert: {
          after_quantity: number
          before_quantity: number
          correlation_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          idempotency_key?: string | null
          inventory_item_id: string
          location_id: string
          notes?: string | null
          occurred_at: string
          organization_id: string
          quantity: number
          reason: string
          reference_id?: string | null
          reference_type?: string | null
          reverses_movement_id?: string | null
          signed_delta: number
          type: string
          variant_id: string
        }
        Update: {
          after_quantity?: number
          before_quantity?: number
          correlation_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          idempotency_key?: string | null
          inventory_item_id?: string
          location_id?: string
          notes?: string | null
          occurred_at?: string
          organization_id?: string
          quantity?: number
          reason?: string
          reference_id?: string | null
          reference_type?: string | null
          reverses_movement_id?: string | null
          signed_delta?: number
          type?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_ledger_movement_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "analytics_inventory_preparation_fact"
            referencedColumns: ["inventory_item_id"]
          },
          {
            foreignKeyName: "inventory_ledger_movement_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_ledger_movement_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "stock_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_ledger_movement_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_ledger_movement_reverses_movement_id_fkey"
            columns: ["reverses_movement_id"]
            isOneToOne: false
            referencedRelation: "inventory_ledger_movement"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_ledger_movement_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variant"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movement: {
        Row: {
          created_at: string
          created_by: string
          id: string
          notes: string | null
          occurred_at: string
          organization_id: string
          product_id: string
          quantity: number
          reason: string
          reference_id: string | null
          reference_type: string | null
          type: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          notes?: string | null
          occurred_at: string
          organization_id: string
          product_id: string
          quantity: number
          reason: string
          reference_id?: string | null
          reference_type?: string | null
          type: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          notes?: string | null
          occurred_at?: string
          organization_id?: string
          product_id?: string
          quantity?: number
          reason?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movement_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movement_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_product_fact"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_movement_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_packing: {
        Row: {
          created_at: string
          created_by: string
          customer_document: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          location_id: string
          notes: string | null
          number: string
          organization_id: string
          picking_id: string
          picking_number: string
          reservation_id: string
          reservation_number: string
          source_id: string
          source_number: string
          source_type: string
          status: string
          total_quantity_picked: number
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          customer_document?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          location_id: string
          notes?: string | null
          number: string
          organization_id: string
          picking_id: string
          picking_number: string
          reservation_id: string
          reservation_number: string
          source_id: string
          source_number: string
          source_type: string
          status?: string
          total_quantity_picked?: number
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          customer_document?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          location_id?: string
          notes?: string | null
          number?: string
          organization_id?: string
          picking_id?: string
          picking_number?: string
          reservation_id?: string
          reservation_number?: string
          source_id?: string
          source_number?: string
          source_type?: string
          status?: string
          total_quantity_picked?: number
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_packing_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "stock_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_packing_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_packing_picking_id_fkey"
            columns: ["picking_id"]
            isOneToOne: false
            referencedRelation: "inventory_picking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_packing_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "inventory_reservation"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_packing_history: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string
          id: string
          new_value: string | null
          old_value: string | null
          organization_id: string
          packing_id: string
          reason: string | null
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id: string
          packing_id: string
          reason?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id?: string
          packing_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_packing_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_packing_history_packing_id_fkey"
            columns: ["packing_id"]
            isOneToOne: false
            referencedRelation: "inventory_packing"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_packing_item: {
        Row: {
          created_at: string
          id: string
          location_id: string
          organization_id: string
          packing_id: string
          picking_item_id: string
          product_id: string
          product_name: string
          quantity_picked: number
          reservation_item_id: string
          sku: string
          sort_order: number
          status: string
          unit_code: string
          variant_description: string | null
          variant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          organization_id: string
          packing_id: string
          picking_item_id: string
          product_id: string
          product_name: string
          quantity_picked: number
          reservation_item_id: string
          sku: string
          sort_order: number
          status?: string
          unit_code: string
          variant_description?: string | null
          variant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          organization_id?: string
          packing_id?: string
          picking_item_id?: string
          product_id?: string
          product_name?: string
          quantity_picked?: number
          reservation_item_id?: string
          sku?: string
          sort_order?: number
          status?: string
          unit_code?: string
          variant_description?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_packing_item_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "stock_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_packing_item_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_packing_item_packing_id_fkey"
            columns: ["packing_id"]
            isOneToOne: false
            referencedRelation: "inventory_packing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_packing_item_picking_item_id_fkey"
            columns: ["picking_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_picking_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_packing_item_reservation_item_id_fkey"
            columns: ["reservation_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_reservation_item"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_packing_number_counter: {
        Row: {
          last_value: number
          organization_id: string
        }
        Insert: {
          last_value?: number
          organization_id: string
        }
        Update: {
          last_value?: number
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_packing_number_counter_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_packing_search: {
        Row: {
          created_at: string
          customer_document: string | null
          customer_name: string
          number: string
          organization_id: string
          packing_date: string
          packing_id: string
          picking_id: string
          picking_number: string
          reservation_id: string
          reservation_number: string
          search_text: string
          source_id: string
          source_number: string
          source_type: string
          status: string
          total_quantity_picked: number
          updated_at: string
        }
        Insert: {
          created_at: string
          customer_document?: string | null
          customer_name: string
          number: string
          organization_id: string
          packing_date: string
          packing_id: string
          picking_id: string
          picking_number: string
          reservation_id: string
          reservation_number: string
          search_text: string
          source_id: string
          source_number: string
          source_type: string
          status: string
          total_quantity_picked: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_document?: string | null
          customer_name?: string
          number?: string
          organization_id?: string
          packing_date?: string
          packing_id?: string
          picking_id?: string
          picking_number?: string
          reservation_id?: string
          reservation_number?: string
          search_text?: string
          source_id?: string
          source_number?: string
          source_type?: string
          status?: string
          total_quantity_picked?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_packing_search_packing_id_fkey"
            columns: ["packing_id"]
            isOneToOne: true
            referencedRelation: "inventory_packing"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_picking: {
        Row: {
          created_at: string
          created_by: string
          customer_document: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          location_id: string
          notes: string | null
          number: string
          organization_id: string
          reservation_id: string
          reservation_number: string
          source_id: string
          source_number: string
          source_type: string
          status: string
          total_quantity_picked: number
          total_quantity_reserved: number
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          customer_document?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          location_id: string
          notes?: string | null
          number: string
          organization_id: string
          reservation_id: string
          reservation_number: string
          source_id: string
          source_number: string
          source_type: string
          status?: string
          total_quantity_picked?: number
          total_quantity_reserved?: number
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          customer_document?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          location_id?: string
          notes?: string | null
          number?: string
          organization_id?: string
          reservation_id?: string
          reservation_number?: string
          source_id?: string
          source_number?: string
          source_type?: string
          status?: string
          total_quantity_picked?: number
          total_quantity_reserved?: number
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_picking_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "stock_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_picking_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_picking_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "inventory_reservation"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_picking_history: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string
          id: string
          new_value: string | null
          old_value: string | null
          organization_id: string
          picking_id: string
          reason: string | null
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id: string
          picking_id: string
          reason?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id?: string
          picking_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_picking_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_picking_history_picking_id_fkey"
            columns: ["picking_id"]
            isOneToOne: false
            referencedRelation: "inventory_picking"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_picking_item: {
        Row: {
          created_at: string
          id: string
          location_id: string
          organization_id: string
          picking_id: string
          product_id: string
          product_name: string
          quantity_picked: number
          quantity_reserved: number
          reservation_item_id: string
          sku: string
          sort_order: number
          status: string
          unit_code: string
          variant_description: string | null
          variant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          organization_id: string
          picking_id: string
          product_id: string
          product_name: string
          quantity_picked?: number
          quantity_reserved: number
          reservation_item_id: string
          sku: string
          sort_order: number
          status?: string
          unit_code: string
          variant_description?: string | null
          variant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          organization_id?: string
          picking_id?: string
          product_id?: string
          product_name?: string
          quantity_picked?: number
          quantity_reserved?: number
          reservation_item_id?: string
          sku?: string
          sort_order?: number
          status?: string
          unit_code?: string
          variant_description?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_picking_item_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "stock_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_picking_item_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_picking_item_picking_id_fkey"
            columns: ["picking_id"]
            isOneToOne: false
            referencedRelation: "inventory_picking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_picking_item_reservation_item_id_fkey"
            columns: ["reservation_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_reservation_item"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_picking_number_counter: {
        Row: {
          last_value: number
          organization_id: string
        }
        Insert: {
          last_value?: number
          organization_id: string
        }
        Update: {
          last_value?: number
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_picking_number_counter_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_picking_search: {
        Row: {
          created_at: string
          customer_document: string | null
          customer_name: string
          number: string
          organization_id: string
          picking_date: string
          picking_id: string
          reservation_id: string
          reservation_number: string
          search_text: string
          source_id: string
          source_number: string
          source_type: string
          status: string
          total_quantity_picked: number
          total_quantity_reserved: number
          updated_at: string
        }
        Insert: {
          created_at: string
          customer_document?: string | null
          customer_name: string
          number: string
          organization_id: string
          picking_date: string
          picking_id: string
          reservation_id: string
          reservation_number: string
          search_text: string
          source_id: string
          source_number: string
          source_type: string
          status: string
          total_quantity_picked: number
          total_quantity_reserved: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_document?: string | null
          customer_name?: string
          number?: string
          organization_id?: string
          picking_date?: string
          picking_id?: string
          reservation_id?: string
          reservation_number?: string
          search_text?: string
          source_id?: string
          source_number?: string
          source_type?: string
          status?: string
          total_quantity_picked?: number
          total_quantity_reserved?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_picking_search_picking_id_fkey"
            columns: ["picking_id"]
            isOneToOne: true
            referencedRelation: "inventory_picking"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_policy: {
        Row: {
          allow_confirmation_without_stock: boolean
          allow_negative_stock: boolean
          allow_partial_reservation: boolean
          automatic_reservation: boolean
          automatic_stock_decrease: boolean
          created_at: string
          created_by: string
          organization_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          allow_confirmation_without_stock?: boolean
          allow_negative_stock?: boolean
          allow_partial_reservation?: boolean
          automatic_reservation?: boolean
          automatic_stock_decrease?: boolean
          created_at?: string
          created_by: string
          organization_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          allow_confirmation_without_stock?: boolean
          allow_negative_stock?: boolean
          allow_partial_reservation?: boolean
          automatic_reservation?: boolean
          automatic_stock_decrease?: boolean
          created_at?: string
          created_by?: string
          organization_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_policy_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_policy_history: {
        Row: {
          action: string
          actor_user_id: string
          after_state: Json
          before_state: Json | null
          created_at: string
          id: string
          organization_id: string
        }
        Insert: {
          action: string
          actor_user_id: string
          after_state: Json
          before_state?: Json | null
          created_at?: string
          id?: string
          organization_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          after_state?: Json
          before_state?: Json | null
          created_at?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_policy_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_reservation: {
        Row: {
          created_at: string
          created_by: string
          customer_document: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          location_id: string
          notes: string | null
          number: string
          organization_id: string
          source_id: string
          source_number: string
          source_type: string
          status: string
          total_quantity_released: number
          total_quantity_reserved: number
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          customer_document?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          location_id: string
          notes?: string | null
          number: string
          organization_id: string
          source_id: string
          source_number: string
          source_type: string
          status?: string
          total_quantity_released?: number
          total_quantity_reserved?: number
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          customer_document?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          location_id?: string
          notes?: string | null
          number?: string
          organization_id?: string
          source_id?: string
          source_number?: string
          source_type?: string
          status?: string
          total_quantity_released?: number
          total_quantity_reserved?: number
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reservation_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "stock_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reservation_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_reservation_history: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string
          id: string
          new_value: string | null
          old_value: string | null
          organization_id: string
          reason: string | null
          reservation_id: string
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id: string
          reason?: string | null
          reservation_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id?: string
          reason?: string | null
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reservation_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reservation_history_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "inventory_reservation"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_reservation_item: {
        Row: {
          created_at: string
          id: string
          location_id: string
          organization_id: string
          product_id: string
          product_name: string
          quantity_released: number
          quantity_reserved: number
          reservation_id: string
          sales_order_item_id: string | null
          sku: string
          sort_order: number
          status: string
          unit_code: string
          variant_description: string | null
          variant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id: string
          organization_id: string
          product_id: string
          product_name: string
          quantity_released?: number
          quantity_reserved: number
          reservation_id: string
          sales_order_item_id?: string | null
          sku: string
          sort_order: number
          status?: string
          unit_code: string
          variant_description?: string | null
          variant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string
          organization_id?: string
          product_id?: string
          product_name?: string
          quantity_released?: number
          quantity_reserved?: number
          reservation_id?: string
          sales_order_item_id?: string | null
          sku?: string
          sort_order?: number
          status?: string
          unit_code?: string
          variant_description?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reservation_item_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "stock_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reservation_item_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reservation_item_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "inventory_reservation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_reservation_item_sales_order_item_id_fkey"
            columns: ["sales_order_item_id"]
            isOneToOne: false
            referencedRelation: "sales_order_item"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_reservation_number_counter: {
        Row: {
          last_value: number
          organization_id: string
        }
        Insert: {
          last_value?: number
          organization_id: string
        }
        Update: {
          last_value?: number
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reservation_number_counter_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_reservation_search: {
        Row: {
          created_at: string
          customer_document: string | null
          customer_name: string
          number: string
          organization_id: string
          reservation_date: string
          reservation_id: string
          search_text: string
          source_id: string
          source_number: string
          source_type: string
          status: string
          total_quantity_released: number
          total_quantity_reserved: number
          updated_at: string
        }
        Insert: {
          created_at: string
          customer_document?: string | null
          customer_name: string
          number: string
          organization_id: string
          reservation_date: string
          reservation_id: string
          search_text: string
          source_id: string
          source_number: string
          source_type: string
          status: string
          total_quantity_released: number
          total_quantity_reserved: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_document?: string | null
          customer_name?: string
          number?: string
          organization_id?: string
          reservation_date?: string
          reservation_id?: string
          search_text?: string
          source_id?: string
          source_number?: string
          source_type?: string
          status?: string
          total_quantity_released?: number
          total_quantity_reserved?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_reservation_search_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: true
            referencedRelation: "inventory_reservation"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_shipment: {
        Row: {
          carrier: string | null
          created_at: string
          created_by: string
          customer_document: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          delivered_date: string | null
          dispatch_date: string | null
          dispatch_idempotency_key: string | null
          estimated_delivery_date: string | null
          freight_amount: number | null
          id: string
          location_id: string
          notes: string | null
          number: string
          organization_id: string
          packing_id: string
          packing_number: string
          picking_id: string
          picking_number: string
          reservation_id: string
          reservation_number: string
          service: string | null
          source_id: string
          source_number: string
          source_type: string
          status: string
          total_quantity_packed: number
          total_quantity_shipped: number
          tracking_code: string | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          created_by: string
          customer_document?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          delivered_date?: string | null
          dispatch_date?: string | null
          dispatch_idempotency_key?: string | null
          estimated_delivery_date?: string | null
          freight_amount?: number | null
          id?: string
          location_id: string
          notes?: string | null
          number: string
          organization_id: string
          packing_id: string
          packing_number: string
          picking_id: string
          picking_number: string
          reservation_id: string
          reservation_number: string
          service?: string | null
          source_id: string
          source_number: string
          source_type: string
          status?: string
          total_quantity_packed?: number
          total_quantity_shipped?: number
          tracking_code?: string | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          carrier?: string | null
          created_at?: string
          created_by?: string
          customer_document?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivered_date?: string | null
          dispatch_date?: string | null
          dispatch_idempotency_key?: string | null
          estimated_delivery_date?: string | null
          freight_amount?: number | null
          id?: string
          location_id?: string
          notes?: string | null
          number?: string
          organization_id?: string
          packing_id?: string
          packing_number?: string
          picking_id?: string
          picking_number?: string
          reservation_id?: string
          reservation_number?: string
          service?: string | null
          source_id?: string
          source_number?: string
          source_type?: string
          status?: string
          total_quantity_packed?: number
          total_quantity_shipped?: number
          tracking_code?: string | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_shipment_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "stock_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_shipment_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_shipment_packing_id_fkey"
            columns: ["packing_id"]
            isOneToOne: false
            referencedRelation: "inventory_packing"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_shipment_picking_id_fkey"
            columns: ["picking_id"]
            isOneToOne: false
            referencedRelation: "inventory_picking"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_shipment_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "inventory_reservation"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_shipment_history: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string
          id: string
          new_value: string | null
          old_value: string | null
          organization_id: string
          reason: string | null
          shipment_id: string
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id: string
          reason?: string | null
          shipment_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id?: string
          reason?: string | null
          shipment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_shipment_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_shipment_history_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "inventory_shipment"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_shipment_item: {
        Row: {
          created_at: string
          id: string
          ledger_movement_id: string | null
          location_id: string
          organization_id: string
          packing_item_id: string
          picking_item_id: string
          product_id: string
          product_name: string
          quantity_packed: number
          quantity_shipped: number
          reservation_item_id: string
          shipment_id: string
          sku: string
          sort_order: number
          status: string
          unit_code: string
          updated_at: string
          variant_description: string | null
          variant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ledger_movement_id?: string | null
          location_id: string
          organization_id: string
          packing_item_id: string
          picking_item_id: string
          product_id: string
          product_name: string
          quantity_packed: number
          quantity_shipped: number
          reservation_item_id: string
          shipment_id: string
          sku: string
          sort_order: number
          status?: string
          unit_code: string
          updated_at?: string
          variant_description?: string | null
          variant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ledger_movement_id?: string | null
          location_id?: string
          organization_id?: string
          packing_item_id?: string
          picking_item_id?: string
          product_id?: string
          product_name?: string
          quantity_packed?: number
          quantity_shipped?: number
          reservation_item_id?: string
          shipment_id?: string
          sku?: string
          sort_order?: number
          status?: string
          unit_code?: string
          updated_at?: string
          variant_description?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_shipment_item_ledger_movement_id_fkey"
            columns: ["ledger_movement_id"]
            isOneToOne: false
            referencedRelation: "inventory_ledger_movement"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_shipment_item_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "stock_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_shipment_item_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_shipment_item_packing_item_id_fkey"
            columns: ["packing_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_packing_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_shipment_item_picking_item_id_fkey"
            columns: ["picking_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_picking_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_shipment_item_reservation_item_id_fkey"
            columns: ["reservation_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_reservation_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_shipment_item_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "inventory_shipment"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_shipment_number_counter: {
        Row: {
          last_value: number
          organization_id: string
        }
        Insert: {
          last_value?: number
          organization_id: string
        }
        Update: {
          last_value?: number
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_shipment_number_counter_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_shipment_search: {
        Row: {
          carrier: string | null
          created_at: string
          customer_document: string | null
          customer_name: string
          delivered_date: string | null
          dispatch_date: string | null
          number: string
          organization_id: string
          packing_id: string
          packing_number: string
          picking_id: string
          picking_number: string
          reservation_id: string
          reservation_number: string
          search_text: string
          service: string | null
          shipment_date: string
          shipment_id: string
          source_id: string
          source_number: string
          source_type: string
          status: string
          total_quantity_packed: number
          total_quantity_shipped: number
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          carrier?: string | null
          created_at: string
          customer_document?: string | null
          customer_name: string
          delivered_date?: string | null
          dispatch_date?: string | null
          number: string
          organization_id: string
          packing_id: string
          packing_number: string
          picking_id: string
          picking_number: string
          reservation_id: string
          reservation_number: string
          search_text: string
          service?: string | null
          shipment_date: string
          shipment_id: string
          source_id: string
          source_number: string
          source_type: string
          status: string
          total_quantity_packed: number
          total_quantity_shipped: number
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          carrier?: string | null
          created_at?: string
          customer_document?: string | null
          customer_name?: string
          delivered_date?: string | null
          dispatch_date?: string | null
          number?: string
          organization_id?: string
          packing_id?: string
          packing_number?: string
          picking_id?: string
          picking_number?: string
          reservation_id?: string
          reservation_number?: string
          search_text?: string
          service?: string | null
          shipment_date?: string
          shipment_id?: string
          source_id?: string
          source_number?: string
          source_type?: string
          status?: string
          total_quantity_packed?: number
          total_quantity_shipped?: number
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_shipment_search_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: true
            referencedRelation: "inventory_shipment"
            referencedColumns: ["id"]
          },
        ]
      }
      membership: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_owner: boolean
          organization_id: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_owner?: boolean
          organization_id: string
          role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_owner?: boolean
          organization_id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membership_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_business_profile: {
        Row: {
          created_at: string
          current_system_name: string | null
          current_system_status: string
          migration_interest: boolean | null
          needs: string[]
          needs_other: string | null
          onboarding_id: string
          revenue_range: string
          segment: string
          segment_other: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_system_name?: string | null
          current_system_status: string
          migration_interest?: boolean | null
          needs?: string[]
          needs_other?: string | null
          onboarding_id: string
          revenue_range: string
          segment: string
          segment_other?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_system_name?: string | null
          current_system_status?: string
          migration_interest?: boolean | null
          needs?: string[]
          needs_other?: string | null
          onboarding_id?: string
          revenue_range?: string
          segment?: string
          segment_other?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_business_profile_onboarding_id_fkey"
            columns: ["onboarding_id"]
            isOneToOne: true
            referencedRelation: "onboarding_session"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_consent: {
        Row: {
          accepted_at: string
          document_type: string
          document_version: string
          id: string
          onboarding_id: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string
          document_type: string
          document_version: string
          id?: string
          onboarding_id: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string
          document_type?: string
          document_version?: string
          id?: string
          onboarding_id?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_consent_onboarding_id_fkey"
            columns: ["onboarding_id"]
            isOneToOne: false
            referencedRelation: "onboarding_session"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_event: {
        Row: {
          created_at: string
          event_type: string
          id: string
          onboarding_id: string
          payload: Json
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          onboarding_id: string
          payload?: Json
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          onboarding_id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_event_onboarding_id_fkey"
            columns: ["onboarding_id"]
            isOneToOne: false
            referencedRelation: "onboarding_session"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_rate_limit: {
        Row: {
          attempts: number
          subject: string
          updated_at: string
          window_started_at: string
        }
        Insert: {
          attempts?: number
          subject: string
          updated_at?: string
          window_started_at?: string
        }
        Update: {
          attempts?: number
          subject?: string
          updated_at?: string
          window_started_at?: string
        }
        Relationships: []
      }
      onboarding_session: {
        Row: {
          completed_at: string | null
          correlation_id: string | null
          created_at: string
          current_step: string
          email: string
          expires_at: string
          full_name: string
          id: string
          idempotency_key: string
          last_activity_at: string
          normalized_email: string
          phone: string
          public_id: string
          referrer: string | null
          started_at: string
          state: string
          updated_at: string
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          completed_at?: string | null
          correlation_id?: string | null
          created_at?: string
          current_step?: string
          email: string
          expires_at?: string
          full_name: string
          id?: string
          idempotency_key: string
          last_activity_at?: string
          normalized_email: string
          phone: string
          public_id?: string
          referrer?: string | null
          started_at?: string
          state?: string
          updated_at?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          completed_at?: string | null
          correlation_id?: string | null
          created_at?: string
          current_step?: string
          email?: string
          expires_at?: string
          full_name?: string
          id?: string
          idempotency_key?: string
          last_activity_at?: string
          normalized_email?: string
          phone?: string
          public_id?: string
          referrer?: string | null
          started_at?: string
          state?: string
          updated_at?: string
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      organization: {
        Row: {
          created_at: string
          created_by: string
          currency: string
          id: string
          name: string
          slug: string
          status: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by: string
          currency?: string
          id?: string
          name: string
          slug: string
          status?: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string
          currency?: string
          id?: string
          name?: string
          slug?: string
          status?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      organization_entitlement_override: {
        Row: {
          created_at: string
          created_by: string | null
          entitlement_key: string
          expires_at: string | null
          id: string
          organization_id: string
          reason: string
          value: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          entitlement_key: string
          expires_at?: string | null
          id?: string
          organization_id: string
          reason: string
          value: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          entitlement_key?: string
          expires_at?: string | null
          id?: string
          organization_id?: string
          reason?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "organization_entitlement_override_entitlement_key_fkey"
            columns: ["entitlement_key"]
            isOneToOne: false
            referencedRelation: "entitlement_definition"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "organization_entitlement_override_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_onboarding: {
        Row: {
          checklist: Json
          completed_at: string | null
          created_at: string
          dismissed_at: string | null
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          checklist?: Json
          completed_at?: string | null
          created_at?: string
          dismissed_at?: string | null
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          checklist?: Json
          completed_at?: string | null
          created_at?: string
          dismissed_at?: string | null
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_onboarding_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      payable_installment: {
        Row: {
          accounts_payable_id: string
          amount: number
          created_at: string
          created_by: string
          due_date: string
          id: string
          notes: string | null
          open_balance: number
          organization_id: string
          sequence: number
          status: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          accounts_payable_id: string
          amount: number
          created_at?: string
          created_by: string
          due_date: string
          id?: string
          notes?: string | null
          open_balance: number
          organization_id: string
          sequence: number
          status?: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          accounts_payable_id?: string
          amount?: number
          created_at?: string
          created_by?: string
          due_date?: string
          id?: string
          notes?: string | null
          open_balance?: number
          organization_id?: string
          sequence?: number
          status?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "payable_installment_accounts_payable_id_fkey"
            columns: ["accounts_payable_id"]
            isOneToOne: false
            referencedRelation: "accounts_payable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payable_installment_accounts_payable_id_fkey"
            columns: ["accounts_payable_id"]
            isOneToOne: false
            referencedRelation: "analytics_payable_open_fact"
            referencedColumns: ["payable_id"]
          },
          {
            foreignKeyName: "payable_installment_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      payment: {
        Row: {
          archived_at: string | null
          branch_id: string | null
          cash_account_id: string | null
          company_id: string | null
          confirmation_idempotency_key: string | null
          confirmed_at: string | null
          created_at: string
          created_by: string
          discount_amount: number
          external_reference: string | null
          fee_amount: number
          financial_account_id: string | null
          financial_account_name: string | null
          gross_amount: number
          id: string
          interest_amount: number
          method: string
          net_amount: number | null
          notes: string | null
          occurred_at: string | null
          organization_id: string
          paid_at: string
          payment_type: string | null
          penalty_amount: number
          posted_idempotency_key: string | null
          reversal_idempotency_key: string | null
          reversal_reason: string | null
          reversed_at: string | null
          reverses_payment_id: string | null
          status: string
          supplier_id: string | null
          supplier_legal_name: string | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          branch_id?: string | null
          cash_account_id?: string | null
          company_id?: string | null
          confirmation_idempotency_key?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by: string
          discount_amount?: number
          external_reference?: string | null
          fee_amount?: number
          financial_account_id?: string | null
          financial_account_name?: string | null
          gross_amount: number
          id?: string
          interest_amount?: number
          method: string
          net_amount?: number | null
          notes?: string | null
          occurred_at?: string | null
          organization_id: string
          paid_at: string
          payment_type?: string | null
          penalty_amount?: number
          posted_idempotency_key?: string | null
          reversal_idempotency_key?: string | null
          reversal_reason?: string | null
          reversed_at?: string | null
          reverses_payment_id?: string | null
          status?: string
          supplier_id?: string | null
          supplier_legal_name?: string | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          branch_id?: string | null
          cash_account_id?: string | null
          company_id?: string | null
          confirmation_idempotency_key?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string
          discount_amount?: number
          external_reference?: string | null
          fee_amount?: number
          financial_account_id?: string | null
          financial_account_name?: string | null
          gross_amount?: number
          id?: string
          interest_amount?: number
          method?: string
          net_amount?: number | null
          notes?: string | null
          occurred_at?: string | null
          organization_id?: string
          paid_at?: string
          payment_type?: string | null
          penalty_amount?: number
          posted_idempotency_key?: string | null
          reversal_idempotency_key?: string | null
          reversal_reason?: string | null
          reversed_at?: string | null
          reverses_payment_id?: string | null
          status?: string
          supplier_id?: string | null
          supplier_legal_name?: string | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_cash_account_id_fkey"
            columns: ["cash_account_id"]
            isOneToOne: false
            referencedRelation: "cash_account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_financial_account_id_fkey"
            columns: ["financial_account_id"]
            isOneToOne: false
            referencedRelation: "financial_account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_reverses_payment_id_fkey"
            columns: ["reverses_payment_id"]
            isOneToOne: false
            referencedRelation: "payment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_allocation: {
        Row: {
          accounts_payable_id: string | null
          accounts_receivable_id: string | null
          amount: number
          branch_id: string | null
          company_id: string | null
          created_at: string
          created_by: string
          id: string
          idempotency_key: string | null
          organization_id: string
          payable_installment_id: string | null
          payment_id: string
          receivable_installment_id: string | null
          reversed_at: string | null
        }
        Insert: {
          accounts_payable_id?: string | null
          accounts_receivable_id?: string | null
          amount: number
          branch_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          idempotency_key?: string | null
          organization_id: string
          payable_installment_id?: string | null
          payment_id: string
          receivable_installment_id?: string | null
          reversed_at?: string | null
        }
        Update: {
          accounts_payable_id?: string | null
          accounts_receivable_id?: string | null
          amount?: number
          branch_id?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          idempotency_key?: string | null
          organization_id?: string
          payable_installment_id?: string | null
          payment_id?: string
          receivable_installment_id?: string | null
          reversed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocation_accounts_payable_id_fkey"
            columns: ["accounts_payable_id"]
            isOneToOne: false
            referencedRelation: "accounts_payable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocation_accounts_payable_id_fkey"
            columns: ["accounts_payable_id"]
            isOneToOne: false
            referencedRelation: "analytics_payable_open_fact"
            referencedColumns: ["payable_id"]
          },
          {
            foreignKeyName: "payment_allocation_accounts_receivable_id_fkey"
            columns: ["accounts_receivable_id"]
            isOneToOne: false
            referencedRelation: "accounts_receivable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocation_accounts_receivable_id_fkey"
            columns: ["accounts_receivable_id"]
            isOneToOne: false
            referencedRelation: "analytics_receivable_open_fact"
            referencedColumns: ["receivable_id"]
          },
          {
            foreignKeyName: "payment_allocation_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocation_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocation_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocation_payable_installment_id_fkey"
            columns: ["payable_installment_id"]
            isOneToOne: false
            referencedRelation: "analytics_payable_open_fact"
            referencedColumns: ["installment_id"]
          },
          {
            foreignKeyName: "payment_allocation_payable_installment_id_fkey"
            columns: ["payable_installment_id"]
            isOneToOne: false
            referencedRelation: "payable_installment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocation_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocation_receivable_installment_id_fkey"
            columns: ["receivable_installment_id"]
            isOneToOne: false
            referencedRelation: "analytics_receivable_open_fact"
            referencedColumns: ["installment_id"]
          },
          {
            foreignKeyName: "payment_allocation_receivable_installment_id_fkey"
            columns: ["receivable_installment_id"]
            isOneToOne: false
            referencedRelation: "receivable_installment"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_history: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string
          id: string
          metadata: Json
          organization_id: string
          payment_id: string
          reason: string | null
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string
          id?: string
          metadata?: Json
          organization_id: string
          payment_id: string
          reason?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          organization_id?: string
          payment_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_history_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payment"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_method: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          code: string
          created_at: string
          created_by: string
          id: string
          is_default: boolean
          kind: string
          name: string
          organization_id: string
          status: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          code: string
          created_at?: string
          created_by: string
          id?: string
          is_default?: boolean
          kind: string
          name: string
          organization_id: string
          status?: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          code?: string
          created_at?: string
          created_by?: string
          id?: string
          is_default?: boolean
          kind?: string
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_method_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_method_history: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string
          details: Json
          id: string
          organization_id: string
          payment_method_id: string
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string
          details?: Json
          id?: string
          organization_id: string
          payment_method_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string
          details?: Json
          id?: string
          organization_id?: string
          payment_method_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_method_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_method_history_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_method"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_search: {
        Row: {
          external_reference: string | null
          financial_account_id: string | null
          financial_account_name: string | null
          method: string
          net_amount: number
          organization_id: string
          paid_at: string
          payment_id: string
          search_text: string
          status: string
          supplier_id: string | null
          supplier_legal_name: string | null
          updated_at: string
        }
        Insert: {
          external_reference?: string | null
          financial_account_id?: string | null
          financial_account_name?: string | null
          method: string
          net_amount: number
          organization_id: string
          paid_at: string
          payment_id: string
          search_text?: string
          status: string
          supplier_id?: string | null
          supplier_legal_name?: string | null
          updated_at?: string
        }
        Update: {
          external_reference?: string | null
          financial_account_id?: string | null
          financial_account_name?: string | null
          method?: string
          net_amount?: number
          organization_id?: string
          paid_at?: string
          payment_id?: string
          search_text?: string
          status?: string
          supplier_id?: string | null
          supplier_legal_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_search_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_search_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: true
            referencedRelation: "payment"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_term: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          code: string
          created_at: string
          created_by: string
          id: string
          is_default: boolean
          kind: string
          name: string
          organization_id: string
          status: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          code: string
          created_at?: string
          created_by: string
          id?: string
          is_default?: boolean
          kind: string
          name: string
          organization_id: string
          status?: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          code?: string
          created_at?: string
          created_by?: string
          id?: string
          is_default?: boolean
          kind?: string
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_term_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_term_history: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string
          details: Json
          id: string
          organization_id: string
          payment_term_id: string
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string
          details?: Json
          id?: string
          organization_id: string
          payment_term_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string
          details?: Json
          id?: string
          organization_id?: string
          payment_term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_term_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_term_history_payment_term_id_fkey"
            columns: ["payment_term_id"]
            isOneToOne: false
            referencedRelation: "payment_term"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_term_installment: {
        Row: {
          created_at: string
          created_by: string
          due_days: number
          id: string
          organization_id: string
          payment_term_id: string
          percentage: number
          sequence: number
          status: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          due_days: number
          id?: string
          organization_id: string
          payment_term_id: string
          percentage: number
          sequence: number
          status?: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          due_days?: number
          id?: string
          organization_id?: string
          payment_term_id?: string
          percentage?: number
          sequence?: number
          status?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_term_installment_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_term_installment_payment_term_id_fkey"
            columns: ["payment_term_id"]
            isOneToOne: false
            referencedRelation: "payment_term"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          amount: number
          currency: string
          effective_at: string
          entry_id: string | null
          id: string
          organization_id: string
          price_list_id: string
          recorded_at: string
          recorded_by: string
          variant_id: string
        }
        Insert: {
          amount: number
          currency?: string
          effective_at: string
          entry_id?: string | null
          id?: string
          organization_id: string
          price_list_id: string
          recorded_at?: string
          recorded_by: string
          variant_id: string
        }
        Update: {
          amount?: number
          currency?: string
          effective_at?: string
          entry_id?: string | null
          id?: string
          organization_id?: string
          price_list_id?: string
          recorded_at?: string
          recorded_by?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "price_list_entry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_history_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variant"
            referencedColumns: ["id"]
          },
        ]
      }
      price_list: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          code: string
          created_at: string
          created_by: string
          currency: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          organization_id: string
          priority: number
          status: string
          updated_at: string
          updated_by: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          code?: string
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          organization_id: string
          priority?: number
          status?: string
          updated_at?: string
          updated_by: string
          valid_from?: string
          valid_to?: string | null
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          code?: string
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          priority?: number
          status?: string
          updated_at?: string
          updated_by?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_list_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      price_list_entry: {
        Row: {
          amount: number
          created_at: string
          created_by: string
          currency: string
          id: string
          idempotency_key: string | null
          minimum_amount: number
          organization_id: string
          price_list_id: string
          status: string
          updated_at: string
          updated_by: string
          valid_from: string
          valid_to: string | null
          variant_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by: string
          currency?: string
          id?: string
          idempotency_key?: string | null
          minimum_amount?: number
          organization_id: string
          price_list_id: string
          status?: string
          updated_at?: string
          updated_by: string
          valid_from: string
          valid_to?: string | null
          variant_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string
          currency?: string
          id?: string
          idempotency_key?: string | null
          minimum_amount?: number
          organization_id?: string
          price_list_id?: string
          status?: string
          updated_at?: string
          updated_by?: string
          valid_from?: string
          valid_to?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_list_entry_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_list_entry_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_list_entry_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variant"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_search_projection: {
        Row: {
          amount: number
          currency: string
          minimum_amount: number
          organization_id: string
          price_list_code: string
          price_list_entry_id: string
          price_list_id: string
          price_list_name: string
          product_id: string
          product_name: string
          sku: string | null
          status: string
          updated_at: string
          valid_from: string
          valid_to: string | null
          variant_id: string
          variant_name: string
        }
        Insert: {
          amount: number
          currency: string
          minimum_amount: number
          organization_id: string
          price_list_code: string
          price_list_entry_id: string
          price_list_id: string
          price_list_name: string
          product_id: string
          product_name: string
          sku?: string | null
          status: string
          updated_at?: string
          valid_from: string
          valid_to?: string | null
          variant_id: string
          variant_name: string
        }
        Update: {
          amount?: number
          currency?: string
          minimum_amount?: number
          organization_id?: string
          price_list_code?: string
          price_list_entry_id?: string
          price_list_id?: string
          price_list_name?: string
          product_id?: string
          product_name?: string
          sku?: string | null
          status?: string
          updated_at?: string
          valid_from?: string
          valid_to?: string | null
          variant_id?: string
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_search_projection_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_search_projection_price_list_entry_id_fkey"
            columns: ["price_list_entry_id"]
            isOneToOne: true
            referencedRelation: "price_list_entry"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_search_projection_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_search_projection_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_product_fact"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "pricing_search_projection_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_search_projection_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variant"
            referencedColumns: ["id"]
          },
        ]
      }
      product: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          brand_id: string | null
          category: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          lifecycle_status: string | null
          name: string
          organization_id: string
          primary_category_id: string | null
          sku: string
          status: string
          unit: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          brand_id?: string | null
          category?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          lifecycle_status?: string | null
          name: string
          organization_id: string
          primary_category_id?: string | null
          sku: string
          status?: string
          unit: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          brand_id?: string | null
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          lifecycle_status?: string | null
          name?: string
          organization_id?: string
          primary_category_id?: string | null
          sku?: string
          status?: string
          unit?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brand"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_brand_same_org_fk"
            columns: ["organization_id", "brand_id"]
            isOneToOne: false
            referencedRelation: "brand"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "product_category_same_org_fk"
            columns: ["organization_id", "primary_category_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "product_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_primary_category_id_fkey"
            columns: ["primary_category_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
        ]
      }
      product_creation_request: {
        Row: {
          created_at: string
          created_by: string
          id: string
          idempotency_key: string
          organization_id: string
          request_payload: Json
          result: Json
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          idempotency_key: string
          organization_id: string
          request_payload: Json
          result: Json
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          idempotency_key?: string
          organization_id?: string
          request_payload?: Json
          result?: Json
        }
        Relationships: [
          {
            foreignKeyName: "product_creation_request_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variant: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          combination_hash: string
          created_at: string
          created_by: string
          id: string
          is_default: boolean
          min_sale_qty: number
          organization_id: string
          product_id: string
          sale_multiple: number
          sku: string | null
          status: string
          tracks_inventory: boolean
          unit_of_measure_id: string | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          combination_hash: string
          created_at?: string
          created_by: string
          id?: string
          is_default?: boolean
          min_sale_qty?: number
          organization_id: string
          product_id: string
          sale_multiple?: number
          sku?: string | null
          status?: string
          tracks_inventory?: boolean
          unit_of_measure_id?: string | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          combination_hash?: string
          created_at?: string
          created_by?: string
          id?: string
          is_default?: boolean
          min_sale_qty?: number
          organization_id?: string
          product_id?: string
          sale_multiple?: number
          sku?: string | null
          status?: string
          tracks_inventory?: boolean
          unit_of_measure_id?: string | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_product_fact"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_variant_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_unit_of_measure_id_fkey"
            columns: ["unit_of_measure_id"]
            isOneToOne: false
            referencedRelation: "unit_of_measure"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variant_attribute_value: {
        Row: {
          attribute_definition_id: string
          created_at: string
          created_by: string | null
          option_id: string
          organization_id: string
          variant_id: string
        }
        Insert: {
          attribute_definition_id: string
          created_at?: string
          created_by?: string | null
          option_id: string
          organization_id: string
          variant_id: string
        }
        Update: {
          attribute_definition_id?: string
          created_at?: string
          created_by?: string | null
          option_id?: string
          organization_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_attribute_value_attribute_definition_id_fkey"
            columns: ["attribute_definition_id"]
            isOneToOne: false
            referencedRelation: "attribute_definition"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_attribute_value_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "attribute_option"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_attribute_value_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_attribute_definition_same_org_fk"
            columns: ["organization_id", "attribute_definition_id"]
            isOneToOne: false
            referencedRelation: "attribute_definition"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "variant_attribute_option_matches_definition_fk"
            columns: ["attribute_definition_id", "option_id"]
            isOneToOne: false
            referencedRelation: "attribute_option"
            referencedColumns: ["definition_id", "id"]
          },
          {
            foreignKeyName: "variant_attribute_variant_same_org_fk"
            columns: ["organization_id", "variant_id"]
            isOneToOne: false
            referencedRelation: "product_variant"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      product_variant_axis: {
        Row: {
          attribute_definition_id: string
          created_at: string
          created_by: string
          id: string
          organization_id: string
          product_id: string
          sort_order: number
          updated_at: string
          updated_by: string
        }
        Insert: {
          attribute_definition_id: string
          created_at?: string
          created_by: string
          id?: string
          organization_id: string
          product_id: string
          sort_order?: number
          updated_at?: string
          updated_by: string
        }
        Update: {
          attribute_definition_id?: string
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
          product_id?: string
          sort_order?: number
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_axis_attribute_definition_id_fkey"
            columns: ["attribute_definition_id"]
            isOneToOne: false
            referencedRelation: "attribute_definition"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_axis_definition_same_org_fk"
            columns: ["organization_id", "attribute_definition_id"]
            isOneToOne: false
            referencedRelation: "attribute_definition"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "product_variant_axis_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_axis_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_product_fact"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_variant_axis_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_axis_product_same_org_fk"
            columns: ["organization_id", "product_id"]
            isOneToOne: false
            referencedRelation: "analytics_product_fact"
            referencedColumns: ["organization_id", "product_id"]
          },
          {
            foreignKeyName: "product_variant_axis_product_same_org_fk"
            columns: ["organization_id", "product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      product_variant_axis_option: {
        Row: {
          axis_id: string
          option_id: string
        }
        Insert: {
          axis_id: string
          option_id: string
        }
        Update: {
          axis_id?: string
          option_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_axis_option_axis_id_fkey"
            columns: ["axis_id"]
            isOneToOne: false
            referencedRelation: "product_variant_axis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_axis_option_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "attribute_option"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variant_barcode: {
        Row: {
          barcode: string
          barcode_type: string
          created_at: string
          created_by: string
          id: string
          is_primary: boolean
          organization_id: string
          updated_at: string
          updated_by: string
          variant_id: string
        }
        Insert: {
          barcode: string
          barcode_type: string
          created_at?: string
          created_by: string
          id?: string
          is_primary?: boolean
          organization_id: string
          updated_at?: string
          updated_by: string
          variant_id: string
        }
        Update: {
          barcode?: string
          barcode_type?: string
          created_at?: string
          created_by?: string
          id?: string
          is_primary?: boolean
          organization_id?: string
          updated_at?: string
          updated_by?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variant_barcode_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_barcode_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variant"
            referencedColumns: ["id"]
          },
        ]
      }
      provisioning_history: {
        Row: {
          action: string
          checkout_id: string
          created_at: string
          id: string
          organization_id: string | null
          payload: Json
          provisioning_id: string
        }
        Insert: {
          action: string
          checkout_id: string
          created_at?: string
          id?: string
          organization_id?: string | null
          payload?: Json
          provisioning_id: string
        }
        Update: {
          action?: string
          checkout_id?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          payload?: Json
          provisioning_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provisioning_history_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "checkout_session"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provisioning_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provisioning_history_provisioning_id_fkey"
            columns: ["provisioning_id"]
            isOneToOne: false
            referencedRelation: "provisioning_run"
            referencedColumns: ["id"]
          },
        ]
      }
      provisioning_job: {
        Row: {
          activation_id: string
          attempt: number
          attempt_count: number
          completed_at: string | null
          correlation_id: string | null
          created_at: string
          error: string | null
          failed_at: string | null
          finished_at: string | null
          id: string
          last_error_code: string | null
          last_error_message: string | null
          locked_at: string | null
          locked_by: string | null
          logs: Json
          max_attempts: number
          next_attempt_at: string
          onboarding_session_id: string
          organization_id: string | null
          public_id: string
          started_at: string | null
          status: string
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          activation_id: string
          attempt?: number
          attempt_count?: number
          completed_at?: string | null
          correlation_id?: string | null
          created_at?: string
          error?: string | null
          failed_at?: string | null
          finished_at?: string | null
          id?: string
          last_error_code?: string | null
          last_error_message?: string | null
          locked_at?: string | null
          locked_by?: string | null
          logs?: Json
          max_attempts?: number
          next_attempt_at?: string
          onboarding_session_id: string
          organization_id?: string | null
          public_id?: string
          started_at?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          activation_id?: string
          attempt?: number
          attempt_count?: number
          completed_at?: string | null
          correlation_id?: string | null
          created_at?: string
          error?: string | null
          failed_at?: string | null
          finished_at?: string | null
          id?: string
          last_error_code?: string | null
          last_error_message?: string | null
          locked_at?: string | null
          locked_by?: string | null
          logs?: Json
          max_attempts?: number
          next_attempt_at?: string
          onboarding_session_id?: string
          organization_id?: string | null
          public_id?: string
          started_at?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provisioning_job_activation_id_fkey"
            columns: ["activation_id"]
            isOneToOne: true
            referencedRelation: "activation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provisioning_job_onboarding_session_id_fkey"
            columns: ["onboarding_session_id"]
            isOneToOne: false
            referencedRelation: "onboarding_session"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provisioning_job_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provisioning_job_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscription"
            referencedColumns: ["id"]
          },
        ]
      }
      provisioning_run: {
        Row: {
          checkout_id: string
          completed_at: string | null
          created_at: string
          failed_reason: string | null
          id: string
          idempotency_key: string
          organization_id: string | null
          owner_id: string | null
          started_at: string | null
          status: string
          subscription_id: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          checkout_id: string
          completed_at?: string | null
          created_at?: string
          failed_reason?: string | null
          id?: string
          idempotency_key: string
          organization_id?: string | null
          owner_id?: string | null
          started_at?: string | null
          status?: string
          subscription_id?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          checkout_id?: string
          completed_at?: string | null
          created_at?: string
          failed_reason?: string | null
          id?: string
          idempotency_key?: string
          organization_id?: string | null
          owner_id?: string | null
          started_at?: string | null
          status?: string
          subscription_id?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provisioning_run_checkout_id_fkey"
            columns: ["checkout_id"]
            isOneToOne: false
            referencedRelation: "checkout_session"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provisioning_run_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provisioning_run_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscription"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_history: {
        Row: {
          action: string
          actor_ip: string | null
          actor_user_id: string
          created_at: string
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
          organization_id: string
          purchase_order_id: string
          reason: string | null
        }
        Insert: {
          action: string
          actor_ip?: string | null
          actor_user_id: string
          created_at?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id: string
          purchase_order_id: string
          reason?: string | null
        }
        Update: {
          action?: string
          actor_ip?: string | null
          actor_user_id?: string
          created_at?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id?: string
          purchase_order_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_history_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_order"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_item: {
        Row: {
          created_at: string
          created_by: string
          currency: string
          description: string | null
          discount: number
          id: string
          organization_id: string
          price_list_id: string | null
          price_source: string
          purchase_order_id: string
          quantity: number
          received_quantity: number
          removed_at: string | null
          sort_order: number
          status: string
          subtotal: number
          total: number
          unit_code: string
          unit_price: number
          updated_at: string
          updated_by: string
          variant_id: string
          variant_name: string
          variant_sku: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          discount?: number
          id?: string
          organization_id: string
          price_list_id?: string | null
          price_source?: string
          purchase_order_id: string
          quantity: number
          received_quantity?: number
          removed_at?: string | null
          sort_order?: number
          status?: string
          subtotal: number
          total: number
          unit_code: string
          unit_price: number
          updated_at?: string
          updated_by: string
          variant_id: string
          variant_name: string
          variant_sku?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          discount?: number
          id?: string
          organization_id?: string
          price_list_id?: string | null
          price_source?: string
          purchase_order_id?: string
          quantity?: number
          received_quantity?: number
          removed_at?: string | null
          sort_order?: number
          status?: string
          subtotal?: number
          total?: number
          unit_code?: string
          unit_price?: number
          updated_at?: string
          updated_by?: string
          variant_id?: string
          variant_name?: string
          variant_sku?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_item_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_item_price_list_fk"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_list"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_item_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_item_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variant"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_number_counter: {
        Row: {
          last_value: number
          organization_id: string
        }
        Insert: {
          last_value?: number
          organization_id: string
        }
        Update: {
          last_value?: number
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_number_counter_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          created_by: string
          currency: string
          discount_total: number
          grand_total: number
          id: string
          notes: string | null
          number: string
          organization_id: string
          previous_status: string | null
          status: string
          subtotal: number
          supplier_document: string | null
          supplier_email: string | null
          supplier_id: string
          supplier_legal_name: string
          supplier_phone: string | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by: string
          currency?: string
          discount_total?: number
          grand_total?: number
          id?: string
          notes?: string | null
          number: string
          organization_id: string
          previous_status?: string | null
          status?: string
          subtotal?: number
          supplier_document?: string | null
          supplier_email?: string | null
          supplier_id: string
          supplier_legal_name: string
          supplier_phone?: string | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          discount_total?: number
          grand_total?: number
          id?: string
          notes?: string | null
          number?: string
          organization_id?: string
          previous_status?: string | null
          status?: string
          subtotal?: number
          supplier_document?: string | null
          supplier_email?: string | null
          supplier_id?: string
          supplier_legal_name?: string
          supplier_phone?: string | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_return: {
        Row: {
          completion_idempotency_key: string | null
          created_at: string
          created_by: string
          goods_receipt_id: string
          id: string
          notes: string | null
          number: string
          organization_id: string
          purchase_order_id: string
          reason: string
          returned_at: string | null
          status: string
          supplier_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          completion_idempotency_key?: string | null
          created_at?: string
          created_by: string
          goods_receipt_id: string
          id?: string
          notes?: string | null
          number: string
          organization_id: string
          purchase_order_id: string
          reason: string
          returned_at?: string | null
          status?: string
          supplier_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          completion_idempotency_key?: string | null
          created_at?: string
          created_by?: string
          goods_receipt_id?: string
          id?: string
          notes?: string | null
          number?: string
          organization_id?: string
          purchase_order_id?: string
          reason?: string
          returned_at?: string | null
          status?: string
          supplier_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_return_goods_receipt_id_fkey"
            columns: ["goods_receipt_id"]
            isOneToOne: false
            referencedRelation: "goods_receipt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_return_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_return_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_return_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_return_history: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string
          details: Json
          id: string
          organization_id: string
          purchase_return_id: string
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string
          details?: Json
          id?: string
          organization_id: string
          purchase_return_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string
          details?: Json
          id?: string
          organization_id?: string
          purchase_return_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_return_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_return_history_purchase_return_id_fkey"
            columns: ["purchase_return_id"]
            isOneToOne: false
            referencedRelation: "purchase_return"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_return_item: {
        Row: {
          created_at: string
          created_by: string
          goods_receipt_item_id: string
          id: string
          ledger_movement_id: string | null
          location_id: string | null
          organization_id: string
          purchase_return_id: string
          received_quantity: number
          returned_quantity: number
          unit_code: string
          updated_at: string
          updated_by: string
          variant_id: string
          variant_name: string
          variant_sku: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          goods_receipt_item_id: string
          id?: string
          ledger_movement_id?: string | null
          location_id?: string | null
          organization_id: string
          purchase_return_id: string
          received_quantity: number
          returned_quantity?: number
          unit_code: string
          updated_at?: string
          updated_by: string
          variant_id: string
          variant_name: string
          variant_sku?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          goods_receipt_item_id?: string
          id?: string
          ledger_movement_id?: string | null
          location_id?: string | null
          organization_id?: string
          purchase_return_id?: string
          received_quantity?: number
          returned_quantity?: number
          unit_code?: string
          updated_at?: string
          updated_by?: string
          variant_id?: string
          variant_name?: string
          variant_sku?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_return_item_goods_receipt_item_id_fkey"
            columns: ["goods_receipt_item_id"]
            isOneToOne: false
            referencedRelation: "goods_receipt_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_return_item_ledger_movement_id_fkey"
            columns: ["ledger_movement_id"]
            isOneToOne: false
            referencedRelation: "inventory_ledger_movement"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_return_item_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "stock_location"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_return_item_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_return_item_purchase_return_id_fkey"
            columns: ["purchase_return_id"]
            isOneToOne: false
            referencedRelation: "purchase_return"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_return_item_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variant"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_return_number_counter: {
        Row: {
          last_value: number
          organization_id: string
        }
        Insert: {
          last_value?: number
          organization_id: string
        }
        Update: {
          last_value?: number
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_return_number_counter_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_return_search: {
        Row: {
          goods_receipt_id: string
          number: string
          organization_id: string
          purchase_order_id: string
          purchase_return_id: string
          returned_at: string | null
          search_text: string
          status: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          goods_receipt_id: string
          number: string
          organization_id: string
          purchase_order_id: string
          purchase_return_id: string
          returned_at?: string | null
          search_text?: string
          status: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          goods_receipt_id?: string
          number?: string
          organization_id?: string
          purchase_order_id?: string
          purchase_return_id?: string
          returned_at?: string | null
          search_text?: string
          status?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_return_search_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_return_search_purchase_return_id_fkey"
            columns: ["purchase_return_id"]
            isOneToOne: true
            referencedRelation: "purchase_return"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_search: {
        Row: {
          created_at: string
          currency: string
          grand_total: number
          number: string
          organization_id: string
          purchase_order_id: string
          search_text: string
          status: string
          supplier_document: string | null
          supplier_legal_name: string
          updated_at: string
        }
        Insert: {
          created_at: string
          currency: string
          grand_total?: number
          number: string
          organization_id: string
          purchase_order_id: string
          search_text?: string
          status: string
          supplier_document?: string | null
          supplier_legal_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          grand_total?: number
          number?: string
          organization_id?: string
          purchase_order_id?: string
          search_text?: string
          status?: string
          supplier_document?: string | null
          supplier_legal_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_search_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_search_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: true
            referencedRelation: "purchase_order"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string
          currency: string
          customer_document: string | null
          customer_email: string | null
          customer_id: string
          customer_name: string
          customer_phone: string | null
          discount_total: number
          grand_total: number
          id: string
          notes: string | null
          number: string
          organization_id: string
          status: string
          subtotal: number
          updated_at: string
          updated_by: string
          valid_until: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by: string
          currency?: string
          customer_document?: string | null
          customer_email?: string | null
          customer_id: string
          customer_name: string
          customer_phone?: string | null
          discount_total?: number
          grand_total: number
          id?: string
          notes?: string | null
          number: string
          organization_id: string
          status?: string
          subtotal: number
          updated_at?: string
          updated_by: string
          valid_until?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          customer_document?: string | null
          customer_email?: string | null
          customer_id?: string
          customer_name?: string
          customer_phone?: string | null
          discount_total?: number
          grand_total?: number
          id?: string
          notes?: string | null
          number?: string
          organization_id?: string
          status?: string
          subtotal?: number
          updated_at?: string
          updated_by?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotation_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "analytics_customer_fact"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "quotation_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      quotation_item: {
        Row: {
          created_at: string
          currency: string
          discount: number
          id: string
          organization_id: string
          price_list_id: string | null
          price_rule_snapshot: Json
          price_source: string
          product_id: string
          product_name: string
          quantity: number
          quotation_id: string
          sku: string
          sort_order: number
          subtotal: number
          total: number
          unit_code: string
          unit_price: number
          variant_description: string | null
          variant_id: string
        }
        Insert: {
          created_at?: string
          currency: string
          discount?: number
          id?: string
          organization_id: string
          price_list_id?: string | null
          price_rule_snapshot?: Json
          price_source?: string
          product_id: string
          product_name: string
          quantity: number
          quotation_id: string
          sku: string
          sort_order: number
          subtotal: number
          total: number
          unit_code: string
          unit_price: number
          variant_description?: string | null
          variant_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          discount?: number
          id?: string
          organization_id?: string
          price_list_id?: string | null
          price_rule_snapshot?: Json
          price_source?: string
          product_id?: string
          product_name?: string
          quantity?: number
          quotation_id?: string
          sku?: string
          sort_order?: number
          subtotal?: number
          total?: number
          unit_code?: string
          unit_price?: number
          variant_description?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_item_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotation_item_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotation"
            referencedColumns: ["id"]
          },
        ]
      }
      receivable_installment: {
        Row: {
          accounts_receivable_id: string
          created_at: string
          created_by: string
          due_date: string
          id: string
          open_amount: number
          organization_id: string
          original_amount: number
          paid_amount: number
          sequence: number
          status: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          accounts_receivable_id: string
          created_at?: string
          created_by: string
          due_date: string
          id?: string
          open_amount: number
          organization_id: string
          original_amount: number
          paid_amount?: number
          sequence: number
          status?: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          accounts_receivable_id?: string
          created_at?: string
          created_by?: string
          due_date?: string
          id?: string
          open_amount?: number
          organization_id?: string
          original_amount?: number
          paid_amount?: number
          sequence?: number
          status?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "receivable_installment_accounts_receivable_id_fkey"
            columns: ["accounts_receivable_id"]
            isOneToOne: false
            referencedRelation: "accounts_receivable"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receivable_installment_accounts_receivable_id_fkey"
            columns: ["accounts_receivable_id"]
            isOneToOne: false
            referencedRelation: "analytics_receivable_open_fact"
            referencedColumns: ["receivable_id"]
          },
          {
            foreignKeyName: "receivable_installment_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_plan: {
        Row: {
          code: string
          created_at: string
          id: string
          marketing_label: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          marketing_label: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          marketing_label?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      saas_plan_entitlement: {
        Row: {
          created_at: string
          entitlement_key: string
          plan_version_id: string
          value: Json
        }
        Insert: {
          created_at?: string
          entitlement_key: string
          plan_version_id: string
          value: Json
        }
        Update: {
          created_at?: string
          entitlement_key?: string
          plan_version_id?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "saas_plan_entitlement_entitlement_key_fkey"
            columns: ["entitlement_key"]
            isOneToOne: false
            referencedRelation: "entitlement_definition"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "saas_plan_entitlement_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "saas_plan_version"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_plan_price: {
        Row: {
          amount: number
          billing_cycle: string
          created_at: string
          currency: string
          id: string
          plan_version_id: string
        }
        Insert: {
          amount?: number
          billing_cycle: string
          created_at?: string
          currency?: string
          id?: string
          plan_version_id: string
        }
        Update: {
          amount?: number
          billing_cycle?: string
          created_at?: string
          currency?: string
          id?: string
          plan_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saas_plan_price_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "saas_plan_version"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_plan_version: {
        Row: {
          created_at: string
          effective_from: string
          id: string
          plan_id: string
          status: string
          trial_days: number
          version: number
        }
        Insert: {
          created_at?: string
          effective_from?: string
          id?: string
          plan_id: string
          status?: string
          trial_days?: number
          version: number
        }
        Update: {
          created_at?: string
          effective_from?: string
          id?: string
          plan_id?: string
          status?: string
          trial_days?: number
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "saas_plan_version_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "saas_plan"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_history: {
        Row: {
          action: string
          actor_user_id: string
          aggregate_id: string
          aggregate_type: string
          created_at: string
          id: string
          new_value: string | null
          old_value: string | null
          organization_id: string
          reason: string | null
        }
        Insert: {
          action: string
          actor_user_id: string
          aggregate_id: string
          aggregate_type: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id: string
          reason?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string
          aggregate_id?: string
          aggregate_type?: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_number_counter: {
        Row: {
          document_type: string
          last_value: number
          organization_id: string
        }
        Insert: {
          document_type: string
          last_value?: number
          organization_id: string
        }
        Update: {
          document_type?: string
          last_value?: number
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_number_counter_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order: {
        Row: {
          archived_at: string | null
          branch_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string
          currency: string
          customer_document: string | null
          customer_email: string | null
          customer_id: string
          customer_name: string
          customer_phone: string | null
          discount_total: number
          grand_total: number
          id: string
          notes: string | null
          number: string
          organization_id: string
          payment_method_id: string | null
          payment_method_snapshot: Json
          payment_term_id: string | null
          payment_term_snapshot: Json
          quotation_id: string | null
          seller_id: string | null
          seller_snapshot: Json
          status: string
          subtotal: number
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          branch_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by: string
          currency?: string
          customer_document?: string | null
          customer_email?: string | null
          customer_id: string
          customer_name: string
          customer_phone?: string | null
          discount_total?: number
          grand_total: number
          id?: string
          notes?: string | null
          number: string
          organization_id: string
          payment_method_id?: string | null
          payment_method_snapshot?: Json
          payment_term_id?: string | null
          payment_term_snapshot?: Json
          quotation_id?: string | null
          seller_id?: string | null
          seller_snapshot?: Json
          status?: string
          subtotal: number
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          branch_id?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          customer_document?: string | null
          customer_email?: string | null
          customer_id?: string
          customer_name?: string
          customer_phone?: string | null
          discount_total?: number
          grand_total?: number
          id?: string
          notes?: string | null
          number?: string
          organization_id?: string
          payment_method_id?: string | null
          payment_method_snapshot?: Json
          payment_term_id?: string | null
          payment_term_snapshot?: Json
          quotation_id?: string | null
          seller_id?: string | null
          seller_snapshot?: Json
          status?: string
          subtotal?: number
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "analytics_customer_fact"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "sales_order_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_method"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_payment_term_id_fkey"
            columns: ["payment_term_id"]
            isOneToOne: false
            referencedRelation: "payment_term"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_order_item: {
        Row: {
          created_at: string
          currency: string
          discount: number
          id: string
          organization_id: string
          price_list_id: string | null
          price_rule_snapshot: Json
          price_source: string
          product_id: string
          product_name: string
          quantity: number
          sales_order_id: string
          sku: string
          sort_order: number
          subtotal: number
          total: number
          unit_code: string
          unit_price: number
          variant_description: string | null
          variant_id: string
        }
        Insert: {
          created_at?: string
          currency: string
          discount?: number
          id?: string
          organization_id: string
          price_list_id?: string | null
          price_rule_snapshot?: Json
          price_source?: string
          product_id: string
          product_name: string
          quantity: number
          sales_order_id: string
          sku: string
          sort_order: number
          subtotal: number
          total: number
          unit_code: string
          unit_price: number
          variant_description?: string | null
          variant_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          discount?: number
          id?: string
          organization_id?: string
          price_list_id?: string | null
          price_rule_snapshot?: Json
          price_source?: string
          product_id?: string
          product_name?: string
          quantity?: number
          sales_order_id?: string
          sku?: string
          sort_order?: number
          subtotal?: number
          total?: number
          unit_code?: string
          unit_price?: number
          variant_description?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_item_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_item_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "analytics_sales_item_fact"
            referencedColumns: ["sales_order_id"]
          },
          {
            foreignKeyName: "sales_order_item_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "analytics_sales_order_fact"
            referencedColumns: ["sales_order_id"]
          },
          {
            foreignKeyName: "sales_order_item_sales_order_id_fkey"
            columns: ["sales_order_id"]
            isOneToOne: false
            referencedRelation: "sales_order"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_search: {
        Row: {
          aggregate_id: string
          aggregate_type: string
          created_at: string
          currency: string
          customer_document: string | null
          customer_name: string
          grand_total: number
          issue_date: string
          number: string
          organization_id: string
          quotation_number: string | null
          search_text: string
          status: string
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          aggregate_id: string
          aggregate_type: string
          created_at: string
          currency: string
          customer_document?: string | null
          customer_name: string
          grand_total: number
          issue_date: string
          number: string
          organization_id: string
          quotation_number?: string | null
          search_text: string
          status: string
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          aggregate_id?: string
          aggregate_type?: string
          created_at?: string
          currency?: string
          customer_document?: string | null
          customer_name?: string
          grand_total?: number
          issue_date?: string
          number?: string
          organization_id?: string
          quotation_number?: string | null
          search_text?: string
          status?: string
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      seller: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          bonus_amount: number
          bonus_target_percentage: number
          branch_id: string | null
          commission_rate: number
          created_at: string
          created_by: string
          full_name: string
          id: string
          organization_id: string
          salary_amount: number
          short_name: string
          status: string
          updated_at: string
          updated_by: string
          user_id: string | null
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          bonus_amount?: number
          bonus_target_percentage?: number
          branch_id?: string | null
          commission_rate?: number
          created_at?: string
          created_by: string
          full_name: string
          id?: string
          organization_id: string
          salary_amount?: number
          short_name: string
          status?: string
          updated_at?: string
          updated_by: string
          user_id?: string | null
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          bonus_amount?: number
          bonus_target_percentage?: number
          branch_id?: string | null
          commission_rate?: number
          created_at?: string
          created_by?: string
          full_name?: string
          id?: string
          organization_id?: string
          salary_amount?: number
          short_name?: string
          status?: string
          updated_at?: string
          updated_by?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seller_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_history: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string
          details: Json
          id: string
          organization_id: string
          seller_id: string
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string
          details?: Json
          id?: string
          organization_id: string
          seller_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string
          details?: Json
          id?: string
          organization_id?: string
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_history_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_location: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          code: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          organization_id: string
          priority: number
          status: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          code: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          organization_id: string
          priority?: number
          status?: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          code?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          priority?: number
          status?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_location_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription: {
        Row: {
          billing_cycle: string
          billing_session_id: string | null
          cancelled_at: string | null
          correlation_id: string | null
          created_at: string
          created_by: string
          currency: string
          current_period_end: string | null
          current_period_start: string
          external_billing_ref: string | null
          gateway_customer_reference: string | null
          gateway_subscription_reference: string | null
          id: string
          next_billing_at: string | null
          onboarding_session_id: string | null
          organization_id: string | null
          plan_id: string | null
          plan_version_id: string
          price_id: string | null
          started_at: string | null
          status: string
          subscription_intent_id: string | null
          trial_ends_at: string | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          billing_cycle: string
          billing_session_id?: string | null
          cancelled_at?: string | null
          correlation_id?: string | null
          created_at?: string
          created_by: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string
          external_billing_ref?: string | null
          gateway_customer_reference?: string | null
          gateway_subscription_reference?: string | null
          id?: string
          next_billing_at?: string | null
          onboarding_session_id?: string | null
          organization_id?: string | null
          plan_id?: string | null
          plan_version_id: string
          price_id?: string | null
          started_at?: string | null
          status: string
          subscription_intent_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          billing_cycle?: string
          billing_session_id?: string | null
          cancelled_at?: string | null
          correlation_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string
          external_billing_ref?: string | null
          gateway_customer_reference?: string | null
          gateway_subscription_reference?: string | null
          id?: string
          next_billing_at?: string | null
          onboarding_session_id?: string | null
          organization_id?: string | null
          plan_id?: string | null
          plan_version_id?: string
          price_id?: string | null
          started_at?: string | null
          status?: string
          subscription_intent_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_billing_session_id_fkey"
            columns: ["billing_session_id"]
            isOneToOne: false
            referencedRelation: "billing_session"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_onboarding_session_id_fkey"
            columns: ["onboarding_session_id"]
            isOneToOne: false
            referencedRelation: "onboarding_session"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "saas_plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "saas_plan_version"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "saas_plan_price"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_subscription_intent_id_fkey"
            columns: ["subscription_intent_id"]
            isOneToOne: false
            referencedRelation: "subscription_intent"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_event: {
        Row: {
          actor_user_id: string | null
          created_at: string
          event_type: string
          id: string
          organization_id: string
          payload: Json
          subscription_id: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          organization_id: string
          payload?: Json
          subscription_id: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          organization_id?: string
          payload?: Json
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_event_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_event_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscription"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_intent: {
        Row: {
          billing_cycle: string
          campaign: string | null
          correlation_id: string | null
          coupon_code: string | null
          created_at: string
          currency: string
          discount: number
          id: string
          idempotency_key: string
          onboarding_session_id: string
          public_id: string
          selected_plan_id: string
          selected_price_id: string
          status: string
          subtotal: number
          total: number
          trial_days: number
          updated_at: string
        }
        Insert: {
          billing_cycle: string
          campaign?: string | null
          correlation_id?: string | null
          coupon_code?: string | null
          created_at?: string
          currency: string
          discount?: number
          id?: string
          idempotency_key: string
          onboarding_session_id: string
          public_id?: string
          selected_plan_id: string
          selected_price_id: string
          status?: string
          subtotal: number
          total: number
          trial_days?: number
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          campaign?: string | null
          correlation_id?: string | null
          coupon_code?: string | null
          created_at?: string
          currency?: string
          discount?: number
          id?: string
          idempotency_key?: string
          onboarding_session_id?: string
          public_id?: string
          selected_plan_id?: string
          selected_price_id?: string
          status?: string
          subtotal?: number
          total?: number
          trial_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_intent_onboarding_session_id_fkey"
            columns: ["onboarding_session_id"]
            isOneToOne: false
            referencedRelation: "onboarding_session"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_intent_selected_plan_id_fkey"
            columns: ["selected_plan_id"]
            isOneToOne: false
            referencedRelation: "saas_plan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_intent_selected_price_id_fkey"
            columns: ["selected_price_id"]
            isOneToOne: false
            referencedRelation: "saas_plan_price"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_intent_event: {
        Row: {
          billing_session_id: string | null
          created_at: string
          event_type: string
          id: string
          payload: Json
          subscription_intent_id: string
        }
        Insert: {
          billing_session_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          subscription_intent_id: string
        }
        Update: {
          billing_session_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          subscription_intent_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_intent_event_billing_session_id_fkey"
            columns: ["billing_session_id"]
            isOneToOne: false
            referencedRelation: "billing_session"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_intent_event_subscription_intent_id_fkey"
            columns: ["subscription_intent_id"]
            isOneToOne: false
            referencedRelation: "subscription_intent"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          city: string | null
          created_at: string
          created_by: string
          document: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          person_type: string
          phone: string | null
          status: string
          trade_name: string | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          city?: string | null
          created_at?: string
          created_by: string
          document?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          person_type: string
          phone?: string | null
          status?: string
          trade_name?: string | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          city?: string | null
          created_at?: string
          created_by?: string
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          person_type?: string
          phone?: string | null
          status?: string
          trade_name?: string | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_address: {
        Row: {
          archived_at: string | null
          city: string
          complement: string | null
          country: string
          created_at: string
          created_by: string
          district: string | null
          id: string
          is_primary: boolean
          kind: string
          number: string | null
          organization_id: string
          postal_code: string
          state: string
          status: string
          street: string
          supplier_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          city: string
          complement?: string | null
          country?: string
          created_at?: string
          created_by: string
          district?: string | null
          id?: string
          is_primary?: boolean
          kind: string
          number?: string | null
          organization_id: string
          postal_code: string
          state: string
          status?: string
          street: string
          supplier_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          city?: string
          complement?: string | null
          country?: string
          created_at?: string
          created_by?: string
          district?: string | null
          id?: string
          is_primary?: boolean
          kind?: string
          number?: string | null
          organization_id?: string
          postal_code?: string
          state?: string
          status?: string
          street?: string
          supplier_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_address_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_address_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_contact: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string
          email: string | null
          id: string
          is_primary: boolean
          name: string
          organization_id: string
          phone: string | null
          role_title: string | null
          status: string
          supplier_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name: string
          organization_id: string
          phone?: string | null
          role_title?: string | null
          status?: string
          supplier_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string
          email?: string | null
          id?: string
          is_primary?: boolean
          name?: string
          organization_id?: string
          phone?: string | null
          role_title?: string | null
          status?: string
          supplier_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_contact_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_contact_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_history: {
        Row: {
          action: string
          actor_ip: string | null
          actor_user_id: string
          created_at: string
          field_name: string | null
          id: string
          new_value: string | null
          old_value: string | null
          organization_id: string
          reason: string | null
          supplier_id: string
        }
        Insert: {
          action: string
          actor_ip?: string | null
          actor_user_id: string
          created_at?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id: string
          reason?: string | null
          supplier_id: string
        }
        Update: {
          action?: string
          actor_ip?: string | null
          actor_user_id?: string
          created_at?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id?: string
          reason?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_history_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_search: {
        Row: {
          document_digits: string | null
          email: string | null
          legal_name: string
          organization_id: string
          phone: string | null
          search_text: string
          status: string
          supplier_id: string
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          document_digits?: string | null
          email?: string | null
          legal_name: string
          organization_id: string
          phone?: string | null
          search_text?: string
          status: string
          supplier_id: string
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          document_digits?: string | null
          email?: string | null
          legal_name?: string
          organization_id?: string
          phone?: string | null
          search_text?: string
          status?: string
          supplier_id?: string
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_search_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_search_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: true
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_profile: {
        Row: {
          cfop: string | null
          code: string
          created_at: string
          created_by: string
          csosn: string | null
          cst: string | null
          id: string
          name: string
          ncm: string | null
          organization_id: string
          origin: string | null
          status: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          cfop?: string | null
          code: string
          created_at?: string
          created_by: string
          csosn?: string | null
          cst?: string | null
          id?: string
          name: string
          ncm?: string | null
          organization_id: string
          origin?: string | null
          status?: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          cfop?: string | null
          code?: string
          created_at?: string
          created_by?: string
          csosn?: string | null
          cst?: string | null
          id?: string
          name?: string
          ncm?: string | null
          organization_id?: string
          origin?: string | null
          status?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_profile_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_provisioning_configuration: {
        Row: {
          created_at: string
          created_by: string
          default_final_consumer_label: string
          fiscal_parameters: Json
          id: string
          organization_id: string
          preferences: Json
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          default_final_consumer_label?: string
          fiscal_parameters?: Json
          id?: string
          organization_id: string
          preferences?: Json
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          default_final_consumer_label?: string
          fiscal_parameters?: Json
          id?: string
          organization_id?: string
          preferences?: Json
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_provisioning_configuration_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_of_measure: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          id: string
          integer_only: boolean
          name: string
          organization_id: string | null
          precision: number
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          integer_only?: boolean
          name: string
          organization_id?: string | null
          precision?: number
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          integer_only?: boolean
          name?: string
          organization_id?: string | null
          precision?: number
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unit_of_measure_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      analytics_calendar_dimension: {
        Row: {
          calendar_date: string | null
          calendar_year: number | null
          day_of_week: number | null
          fiscal_year: number | null
          month_of_year: number | null
          quarter_of_year: number | null
          week_of_year: number | null
        }
        Relationships: []
      }
      analytics_cash_ledger_fact: {
        Row: {
          amount: number | null
          branch_id: string | null
          cash_account_id: string | null
          cash_ledger_entry_id: string | null
          company_id: string | null
          entry_type: string | null
          occurred_at: string | null
          organization_id: string | null
          origin: string | null
          payment_id: string | null
          reversal_of_entry_id: string | null
          transfer_id: string | null
        }
        Insert: {
          amount?: number | null
          branch_id?: string | null
          cash_account_id?: string | null
          cash_ledger_entry_id?: string | null
          company_id?: string | null
          entry_type?: string | null
          occurred_at?: string | null
          organization_id?: string | null
          origin?: string | null
          payment_id?: string | null
          reversal_of_entry_id?: string | null
          transfer_id?: string | null
        }
        Update: {
          amount?: number | null
          branch_id?: string | null
          cash_account_id?: string | null
          cash_ledger_entry_id?: string | null
          company_id?: string | null
          entry_type?: string | null
          occurred_at?: string | null
          organization_id?: string | null
          origin?: string | null
          payment_id?: string | null
          reversal_of_entry_id?: string | null
          transfer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_entry_account_id_fkey"
            columns: ["cash_account_id"]
            isOneToOne: false
            referencedRelation: "cash_account"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_entry_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_entry_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_entry_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_entry_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_entry_reversal_of_entry_id_fkey"
            columns: ["reversal_of_entry_id"]
            isOneToOne: false
            referencedRelation: "analytics_cash_ledger_fact"
            referencedColumns: ["cash_ledger_entry_id"]
          },
          {
            foreignKeyName: "cash_entry_reversal_of_entry_id_fkey"
            columns: ["reversal_of_entry_id"]
            isOneToOne: false
            referencedRelation: "cash_entry"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_customer_fact: {
        Row: {
          created_at: string | null
          customer_id: string | null
          name: string | null
          organization_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          name?: string | null
          organization_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          name?: string | null
          organization_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_inventory_preparation_fact: {
        Row: {
          inventory_item_id: string | null
          organization_id: string | null
          product_id: string | null
          qty_available: number | null
          qty_on_hand: number | null
          qty_reserved: number | null
          status: string | null
          variant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_item_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_item_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variant"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variant_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "analytics_product_fact"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "product_variant_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_payable_open_fact: {
        Row: {
          branch_id: string | null
          company_id: string | null
          due_date: string | null
          installment_id: string | null
          open_amount: number | null
          organization_id: string | null
          original_amount: number | null
          payable_id: string | null
          status: string | null
          supplier_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_payable_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_product_fact: {
        Row: {
          brand_id: string | null
          category_id: string | null
          created_at: string | null
          name: string | null
          organization_id: string | null
          product_id: string | null
          status: string | null
        }
        Insert: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string | null
          name?: string | null
          organization_id?: string | null
          product_id?: string | null
          status?: string | null
        }
        Update: {
          brand_id?: string | null
          category_id?: string | null
          created_at?: string | null
          name?: string | null
          organization_id?: string | null
          product_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brand"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_brand_same_org_fk"
            columns: ["organization_id", "brand_id"]
            isOneToOne: false
            referencedRelation: "brand"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "product_category_same_org_fk"
            columns: ["organization_id", "category_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "product_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_primary_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_receivable_open_fact: {
        Row: {
          branch_id: string | null
          company_id: string | null
          customer_id: string | null
          due_date: string | null
          installment_id: string | null
          open_amount: number | null
          organization_id: string | null
          original_amount: number | null
          paid_amount: number | null
          receivable_id: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "analytics_customer_fact"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "accounts_receivable_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_sales_item_fact: {
        Row: {
          branch_id: string | null
          brand_id: string | null
          brand_name: string | null
          category_id: string | null
          category_name: string | null
          company_id: string | null
          confirmed_at: string | null
          organization_id: string | null
          product_id: string | null
          product_name: string | null
          quantity: number | null
          revenue: number | null
          sales_order_id: string | null
          sku: string | null
          variant_description: string | null
          variant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brand"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_primary_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_organization_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_sales_order_fact: {
        Row: {
          branch_id: string | null
          company_id: string | null
          confirmed_at: string | null
          currency: string | null
          customer_id: string | null
          customer_name: string | null
          number: string | null
          organization_id: string | null
          payment_term_id: string | null
          revenue: number | null
          sales_order_id: string | null
          seller_user_id: string | null
        }
        Insert: {
          branch_id?: string | null
          company_id?: string | null
          confirmed_at?: string | null
          currency?: string | null
          customer_id?: string | null
          customer_name?: string | null
          number?: string | null
          organization_id?: string | null
          payment_term_id?: string | null
          revenue?: number | null
          sales_order_id?: string | null
          seller_user_id?: string | null
        }
        Update: {
          branch_id?: string | null
          company_id?: string | null
          confirmed_at?: string | null
          currency?: string | null
          customer_id?: string | null
          customer_name?: string | null
          number?: string | null
          organization_id?: string | null
          payment_term_id?: string | null
          revenue?: number | null
          sales_order_id?: string | null
          seller_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_order_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branch"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "analytics_customer_fact"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "sales_order_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_organization_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_order_payment_term_id_fkey"
            columns: ["payment_term_id"]
            isOneToOne: false
            referencedRelation: "payment_term"
            referencedColumns: ["id"]
          },
        ]
      }
      cap_activation_timeline: {
        Row: {
          correlation_id: string | null
          last_error_code: string | null
          last_error_message: string | null
          occurred_at: string | null
          onboarding_session_id: string | null
          source: string | null
          source_id: string | null
          state: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_inventory_reservation: {
        Args: { p_org: string; p_reservation_id: string }
        Returns: string
      }
      add_fiscal_document_item: {
        Args: {
          p_cfop: string
          p_csosn: string
          p_cst: string
          p_document: string
          p_ncm: string
          p_org: string
          p_origin: string
          p_quantity: number
          p_snapshot: Json
          p_unit: string
          p_variant: string
        }
        Returns: {
          cfop: string | null
          created_at: string
          created_by: string
          csosn: string | null
          cst: string | null
          fiscal_document_id: string
          id: string
          ncm: string | null
          organization_id: string
          origin: string | null
          quantity: number
          unit_code: string
          variant_id: string
          variant_snapshot: Json
        }
        SetofOptions: {
          from: "*"
          to: "fiscal_document_item"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      add_purchase_return_item: {
        Args: {
          p_goods_receipt_item_id: string
          p_organization_id: string
          p_purchase_return_id: string
          p_returned_quantity: number
        }
        Returns: {
          created_at: string
          created_by: string
          goods_receipt_item_id: string
          id: string
          ledger_movement_id: string | null
          location_id: string | null
          organization_id: string
          purchase_return_id: string
          received_quantity: number
          returned_quantity: number
          unit_code: string
          updated_at: string
          updated_by: string
          variant_id: string
          variant_name: string
          variant_sku: string | null
        }
        SetofOptions: {
          from: "*"
          to: "purchase_return_item"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      allocate_accounts_payable_number: {
        Args: { p_organization_id: string }
        Returns: string
      }
      allocate_goods_receipt_number: {
        Args: { p_organization_id: string }
        Returns: string
      }
      allocate_inventory_packing_number: {
        Args: { p_org: string }
        Returns: string
      }
      allocate_inventory_picking_number: {
        Args: { p_org: string }
        Returns: string
      }
      allocate_inventory_reservation_number: {
        Args: { p_org: string }
        Returns: string
      }
      allocate_inventory_shipment_number: {
        Args: { p_org: string }
        Returns: string
      }
      allocate_purchase_number: {
        Args: { p_organization_id: string }
        Returns: string
      }
      allocate_purchase_return_number: {
        Args: { p_org: string }
        Returns: string
      }
      allocate_sales_number: {
        Args: { p_org: string; p_type: string }
        Returns: string
      }
      analytics_require_read: { Args: { p_org: string }; Returns: undefined }
      apply_inventory_ledger_movement: {
        Args: {
          p_correlation_id?: string
          p_idempotency_key?: string
          p_location_id: string
          p_notes?: string
          p_occurred_at?: string
          p_organization_id: string
          p_quantity: number
          p_reason: string
          p_reference_id?: string
          p_reference_type?: string
          p_reverses_movement_id?: string
          p_signed_delta?: number
          p_type: string
          p_variant_id: string
        }
        Returns: {
          after_quantity: number
          before_quantity: number
          correlation_id: string | null
          created_at: string
          created_by: string
          id: string
          idempotency_key: string | null
          inventory_item_id: string
          location_id: string
          notes: string | null
          occurred_at: string
          organization_id: string
          quantity: number
          reason: string
          reference_id: string | null
          reference_type: string | null
          reverses_movement_id: string | null
          signed_delta: number
          type: string
          variant_id: string
        }
        SetofOptions: {
          from: "*"
          to: "inventory_ledger_movement"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      apply_inventory_ledger_transfer: {
        Args: {
          p_from_location_id: string
          p_idempotency_key?: string
          p_notes?: string
          p_occurred_at?: string
          p_organization_id: string
          p_quantity: number
          p_reason: string
          p_to_location_id: string
          p_variant_id: string
        }
        Returns: {
          after_quantity: number
          before_quantity: number
          correlation_id: string | null
          created_at: string
          created_by: string
          id: string
          idempotency_key: string | null
          inventory_item_id: string
          location_id: string
          notes: string | null
          occurred_at: string
          organization_id: string
          quantity: number
          reason: string
          reference_id: string | null
          reference_type: string | null
          reverses_movement_id: string | null
          signed_delta: number
          type: string
          variant_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "inventory_ledger_movement"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      archive_branch: {
        Args: { p_branch: string; p_org: string }
        Returns: undefined
      }
      archive_fiscal_source_metadata: {
        Args: { p_id: string; p_org: string }
        Returns: {
          created_at: string
          created_by: string
          destination_state: string
          fiscal_date: string
          fiscal_operation_id: string
          id: string
          metadata: Json
          organization_id: string
          origin_state: string
          responsible_user_id: string
          source_id: string
          source_number: string
          source_type: string
          status: string
          supersedes_id: string | null
          tax_profile_id: string
          updated_at: string
          updated_by: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "fiscal_source_metadata"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      archive_payment: {
        Args: { p_organization_id: string; p_payment_id: string }
        Returns: string
      }
      archive_payment_term: {
        Args: { p_org: string; p_term: string }
        Returns: undefined
      }
      archive_price_list: {
        Args: { p_organization_id: string; p_price_list_id: string }
        Returns: undefined
      }
      archive_receivable: {
        Args: { p_id: string; p_organization_id: string }
        Returns: string
      }
      archive_seller: {
        Args: { p_org: string; p_seller: string }
        Returns: undefined
      }
      build_fiscal_document_from_sales: {
        Args: { p_organization_id: string; p_sales_order_id: string }
        Returns: Json
      }
      can_manage_payments: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      can_manage_receivables: { Args: { p_org: string }; Returns: boolean }
      cancel_cash_entry: {
        Args: { p_entry: string; p_org: string }
        Returns: {
          account_id: string
          amount: number
          branch_id: string | null
          company_id: string | null
          correlation_id: string | null
          created_at: string
          created_by: string
          description: string
          entry_type: string
          id: string
          ledger_idempotency_key: string | null
          number: string
          occurred_at: string
          organization_id: string
          origin: string
          payment_id: string | null
          post_idempotency_key: string | null
          reversal_of_entry_id: string | null
          source_document: string | null
          source_id: string | null
          status: string
          transfer_id: string | null
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "cash_entry"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_checkout_session: {
        Args: { p_public_token: string; p_reason?: string }
        Returns: Json
      }
      cancel_finance_payable: {
        Args: { p_org: string; p_payable: string; p_reason: string }
        Returns: string
      }
      cancel_finance_receivable: {
        Args: { p_org: string; p_reason: string; p_receivable: string }
        Returns: string
      }
      cancel_fiscal_document: {
        Args: { p_document: string; p_org: string }
        Returns: {
          created_at: string
          created_by: string
          document_type: string
          id: string
          internal_number: string
          occurred_at: string
          operation_id: string
          organization_id: string
          responsible_user_id: string
          source_document: string | null
          source_id: string | null
          source_type: string | null
          status: string
          tax_profile_id: string
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "fiscal_document"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_inventory_packing: {
        Args: { p_org: string; p_packing_id: string; p_reason?: string }
        Returns: string
      }
      cancel_inventory_picking: {
        Args: { p_org: string; p_picking_id: string; p_reason?: string }
        Returns: string
      }
      cancel_inventory_reservation: {
        Args: { p_org: string; p_reason?: string; p_reservation_id: string }
        Returns: string
      }
      cancel_inventory_shipment: {
        Args: { p_org: string; p_reason?: string; p_shipment_id: string }
        Returns: string
      }
      cancel_purchase_return: {
        Args: { p_organization_id: string; p_purchase_return_id: string }
        Returns: {
          completion_idempotency_key: string | null
          created_at: string
          created_by: string
          goods_receipt_id: string
          id: string
          notes: string | null
          number: string
          organization_id: string
          purchase_order_id: string
          reason: string
          returned_at: string | null
          status: string
          supplier_id: string
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "purchase_return"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_receivable: {
        Args: { p_id: string; p_organization_id: string; p_reason: string }
        Returns: string
      }
      cap_activation_event: {
        Args: { p_activation: string; p_event: string; p_payload?: Json }
        Returns: undefined
      }
      cap_activation_transition_allowed: {
        Args: { p_from: string; p_to: string }
        Returns: boolean
      }
      cap_apply_coupon: {
        Args: { p_coupon_code: string; p_intent_public_id: string }
        Returns: Json
      }
      cap_assert_onboarding_owner: {
        Args: { p_onboarding_id: string }
        Returns: {
          completed_at: string | null
          correlation_id: string | null
          created_at: string
          current_step: string
          email: string
          expires_at: string
          full_name: string
          id: string
          idempotency_key: string
          last_activity_at: string
          normalized_email: string
          phone: string
          public_id: string
          referrer: string | null
          started_at: string
          state: string
          updated_at: string
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        SetofOptions: {
          from: "*"
          to: "onboarding_session"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cap_bind_cakto_checkout: {
        Args: {
          p_billing_session_public_id: string
          p_checkout_url: string
          p_expires_at?: string
          p_gateway_reference: string
        }
        Returns: Json
      }
      cap_calculate_pricing: {
        Args: {
          p_billing_cycle: string
          p_coupon_code?: string
          p_currency?: string
          p_plan_id: string
        }
        Returns: Json
      }
      cap_claim_outbox_events: {
        Args: { p_limit?: number; p_publisher_id: string }
        Returns: {
          aggregate_id: string
          aggregate_type: string
          attempt_count: number
          available_at: string
          correlation_id: string
          event_type: string
          failed_at: string | null
          id: string
          last_error_code: string | null
          last_error_message: string | null
          locked_at: string | null
          locked_by: string | null
          occurred_at: string
          payload: Json
          published_at: string | null
          status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "domain_outbox"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      cap_claim_provisioning_job: {
        Args: { p_worker_id: string }
        Returns: Json
      }
      cap_create_billing_session: {
        Args: {
          p_gateway: string
          p_idempotency_key: string
          p_intent_public_id: string
        }
        Returns: Json
      }
      cap_create_cakto_billing_session: {
        Args: { p_idempotency_key: string; p_intent_public_id: string }
        Returns: Json
      }
      cap_create_subscription_intent: {
        Args: {
          p_billing_cycle: string
          p_coupon_code?: string
          p_currency?: string
          p_idempotency_key: string
          p_onboarding_public_id: string
          p_plan_id: string
        }
        Returns: Json
      }
      cap_execute_provisioning: {
        Args: { p_activation_public_id: string }
        Returns: Json
      }
      cap_fail_activation: {
        Args: { p_activation_public_id: string; p_reason: string }
        Returns: Json
      }
      cap_get_billing_checkout_context: {
        Args: { p_billing_session_public_id: string }
        Returns: Json
      }
      cap_get_plans: { Args: { p_currency?: string }; Returns: Json }
      cap_get_prices: {
        Args: { p_currency?: string; p_plan_id: string }
        Returns: Json
      }
      cap_ingest_billing_event: {
        Args: {
          p_billing_session_public_id: string
          p_correlation_id?: string
          p_event_type: string
          p_external_event_id: string
          p_gateway: string
          p_payload: Json
          p_payload_hash: string
        }
        Returns: Json
      }
      cap_link_account: {
        Args: {
          p_privacy_version: string
          p_public_id: string
          p_terms_version: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: Json
      }
      cap_mark_outbox_event_failed: {
        Args: {
          p_error_code: string
          p_error_message: string
          p_event_id: string
        }
        Returns: Json
      }
      cap_mark_outbox_event_published: {
        Args: { p_event_id: string }
        Returns: undefined
      }
      cap_orchestrate_activation: {
        Args: { p_inbox_id: string }
        Returns: Json
      }
      cap_outbox: {
        Args: {
          p_correlation: string
          p_event: string
          p_id: string
          p_payload: Json
          p_type: string
        }
        Returns: undefined
      }
      cap_provisioning_transition_allowed: {
        Args: { p_from: string; p_to: string }
        Returns: boolean
      }
      cap_record_verified_payment_webhook: {
        Args: {
          p_billing_session_public_id: string
          p_event_type: string
          p_external_event_id: string
          p_gateway: string
          p_payload?: Json
          p_signature_verified: boolean
        }
        Returns: Json
      }
      cap_remove_coupon: { Args: { p_intent_public_id: string }; Returns: Json }
      cap_reprocess_provisioning_dead_letter: {
        Args: { p_activation_public_id: string }
        Returns: Json
      }
      cap_resolve_subscription_price: {
        Args: {
          p_billing_cycle: string
          p_currency?: string
          p_plan_id: string
        }
        Returns: {
          amount: number
          billing_cycle: string
          currency: string
          features: Json
          marketing_label: string
          plan_id: string
          plan_name: string
          price_id: string
          trial_days: number
          trial_mode: string
        }[]
      }
      cap_resume: { Args: { p_public_id: string }; Returns: Json }
      cap_retry_provisioning: {
        Args: { p_activation_public_id: string; p_reason: string }
        Returns: Json
      }
      cap_save_business_profile: {
        Args: {
          p_idempotency_key: string
          p_profile: Json
          p_public_id: string
        }
        Returns: Json
      }
      cap_schedule_provisioning_retry: {
        Args: {
          p_activation_public_id: string
          p_error_code: string
          p_error_message: string
        }
        Returns: Json
      }
      cap_start: {
        Args: {
          p_email: string
          p_idempotency_key: string
          p_name: string
          p_phone: string
          p_utm?: Json
        }
        Returns: Json
      }
      cap_start_activation: {
        Args: { p_billing_session_public_id: string; p_idempotency_key: string }
        Returns: Json
      }
      cap_subscription_intent_transition_allowed: {
        Args: { p_from: string; p_to: string }
        Returns: boolean
      }
      cap_touch: {
        Args: { p_public_id: string }
        Returns: {
          completed_at: string | null
          correlation_id: string | null
          created_at: string
          current_step: string
          email: string
          expires_at: string
          full_name: string
          id: string
          idempotency_key: string
          last_activity_at: string
          normalized_email: string
          phone: string
          public_id: string
          referrer: string | null
          started_at: string
          state: string
          updated_at: string
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        SetofOptions: {
          from: "*"
          to: "onboarding_session"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cap_transition_allowed: {
        Args: { p_from: string; p_to: string }
        Returns: boolean
      }
      cap_update_subscription_intent: {
        Args: {
          p_billing_cycle: string
          p_coupon_code?: string
          p_currency?: string
          p_intent_public_id: string
          p_plan_id: string
        }
        Returns: Json
      }
      cap_validate_coupon: { Args: { p_coupon_code?: string }; Returns: Json }
      cash_has_permission: {
        Args: { p_org: string; p_permission: string }
        Returns: boolean
      }
      catalog_refresh_search_variant: {
        Args: { p_variant_id: string }
        Returns: undefined
      }
      classify_fiscal_variant: {
        Args: { p_org: string; p_profile: string; p_variant: string }
        Returns: {
          created_at: string
          created_by: string
          id: string
          organization_id: string
          tax_profile_id: string
          updated_at: string
          updated_by: string
          variant_id: string
        }
        SetofOptions: {
          from: "*"
          to: "fiscal_classification"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      commercial_has_permission: {
        Args: { p_org: string; p_permission: string }
        Returns: boolean
      }
      commercial_require_permission: {
        Args: { p_org: string; p_permission: string }
        Returns: undefined
      }
      commercial_validate_payment_method: {
        Args: { p_method: string; p_org: string }
        Returns: Json
      }
      commercial_validate_seller: {
        Args: { p_org: string; p_seller: string }
        Returns: Json
      }
      complete_inventory_packing: {
        Args: { p_org: string; p_packing_id: string }
        Returns: string
      }
      complete_inventory_picking: {
        Args: { p_org: string; p_picking_id: string }
        Returns: string
      }
      complete_inventory_shipment: {
        Args: {
          p_delivered_date?: string
          p_org: string
          p_shipment_id: string
        }
        Returns: string
      }
      complete_purchase_return: {
        Args: {
          p_idempotency_key: string
          p_organization_id: string
          p_purchase_return_id: string
        }
        Returns: Json
      }
      compute_product_stock: {
        Args: { p_organization_id: string; p_product_id: string }
        Returns: number
      }
      confirm_payment: {
        Args: {
          p_idempotency_key: string
          p_organization_id: string
          p_payment_id: string
        }
        Returns: string
      }
      convert_quotation_to_sales_order: {
        Args: { p_org: string; p_quotation: string }
        Returns: string
      }
      create_branch: {
        Args: { p_code: string; p_name: string; p_org: string }
        Returns: string
      }
      create_cash_account: {
        Args: { p_code: string; p_name: string; p_org: string; p_type: string }
        Returns: {
          account_type: string
          branch_id: string | null
          code: string
          company_id: string | null
          created_at: string
          created_by: string
          id: string
          name: string
          organization_id: string
          status: string
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "cash_account"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_cash_entry: {
        Args: {
          p_account: string
          p_amount: number
          p_description: string
          p_org: string
          p_origin: string
          p_source_document?: string
          p_source_id?: string
          p_type: string
        }
        Returns: {
          account_id: string
          amount: number
          branch_id: string | null
          company_id: string | null
          correlation_id: string | null
          created_at: string
          created_by: string
          description: string
          entry_type: string
          id: string
          ledger_idempotency_key: string | null
          number: string
          occurred_at: string
          organization_id: string
          origin: string
          payment_id: string | null
          post_idempotency_key: string | null
          reversal_of_entry_id: string | null
          source_document: string | null
          source_id: string | null
          status: string
          transfer_id: string | null
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "cash_entry"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_checkout_session: {
        Args: {
          p_billing_cycle: string
          p_country?: string
          p_currency?: string
          p_language?: string
          p_selected_plan: string
        }
        Returns: Json
      }
      create_finance_cash_account: {
        Args: {
          p_branch: string
          p_code: string
          p_name: string
          p_org: string
          p_type: string
        }
        Returns: string
      }
      create_financial_account: {
        Args: { p_name: string; p_organization_id: string; p_type: string }
        Returns: string
      }
      create_financial_transfer: {
        Args: {
          p_amount: number
          p_destination_account: string
          p_idempotency: string
          p_occurred_at: string
          p_org: string
          p_reference: string
          p_source_account: string
        }
        Returns: string
      }
      create_fiscal_document: {
        Args: {
          p_number: string
          p_operation: string
          p_org: string
          p_profile: string
          p_responsible?: string
          p_source_document: string
          p_source_id: string
          p_type: string
        }
        Returns: {
          created_at: string
          created_by: string
          document_type: string
          id: string
          internal_number: string
          occurred_at: string
          operation_id: string
          organization_id: string
          responsible_user_id: string
          source_document: string | null
          source_id: string | null
          source_type: string | null
          status: string
          tax_profile_id: string
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "fiscal_document"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_fiscal_operation: {
        Args: {
          p_cfop?: string
          p_code: string
          p_name: string
          p_org: string
          p_type: string
        }
        Returns: {
          cfop: string | null
          code: string
          created_at: string
          created_by: string
          id: string
          name: string
          operation_type: string
          organization_id: string
          status: string
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "fiscal_operation"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_fiscal_rule: {
        Args: {
          p_cfop?: string
          p_csosn?: string
          p_cst?: string
          p_destination: string
          p_operation: string
          p_org: string
          p_origin: string
          p_profile: string
        }
        Returns: {
          cfop: string | null
          created_at: string
          created_by: string
          csosn: string | null
          cst: string | null
          destination_state: string
          id: string
          operation_id: string
          organization_id: string
          origin_state: string
          status: string
          tax_profile_id: string
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "fiscal_rule"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_fiscal_source_metadata: {
        Args: {
          p_date: string
          p_destination: string
          p_metadata?: Json
          p_operation: string
          p_org: string
          p_origin: string
          p_profile: string
          p_responsible: string
          p_source_id: string
          p_source_type: string
        }
        Returns: {
          created_at: string
          created_by: string
          destination_state: string
          fiscal_date: string
          fiscal_operation_id: string
          id: string
          metadata: Json
          organization_id: string
          origin_state: string
          responsible_user_id: string
          source_id: string
          source_number: string
          source_type: string
          status: string
          supersedes_id: string | null
          tax_profile_id: string
          updated_at: string
          updated_by: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "fiscal_source_metadata"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_inventory_packing: {
        Args: { p_notes?: string; p_org: string; p_picking_id: string }
        Returns: string
      }
      create_inventory_picking: {
        Args: { p_notes?: string; p_org: string; p_reservation_id: string }
        Returns: string
      }
      create_inventory_reservation_from_sales_order: {
        Args: { p_notes?: string; p_org: string; p_sales_order_id: string }
        Returns: string
      }
      create_inventory_shipment: {
        Args: { p_notes?: string; p_org: string; p_packing_id: string }
        Returns: string
      }
      create_organization: {
        Args: { p_name: string }
        Returns: {
          created_at: string
          created_by: string
          currency: string
          id: string
          name: string
          slug: string
          status: string
          updated_at: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "organization"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_payment: {
        Args: {
          p_allocations: Json
          p_discount_amount: number
          p_external_reference?: string
          p_fee_amount: number
          p_financial_account_id: string
          p_gross_amount: number
          p_interest_amount: number
          p_method: string
          p_notes?: string
          p_organization_id: string
          p_paid_at: string
          p_penalty_amount: number
        }
        Returns: string
      }
      create_payment_method: {
        Args: {
          p_code: string
          p_is_default?: boolean
          p_kind: string
          p_name: string
          p_org: string
        }
        Returns: string
      }
      create_payment_term: {
        Args: {
          p_code: string
          p_installments: Json
          p_is_default?: boolean
          p_kind: string
          p_name: string
          p_org: string
        }
        Returns: string
      }
      create_price_list: {
        Args: {
          p_code: string
          p_currency: string
          p_name: string
          p_organization_id: string
          p_valid_from: string
          p_valid_to?: string
        }
        Returns: string
      }
      create_price_list_item: {
        Args: {
          p_amount: number
          p_minimum_amount: number
          p_organization_id: string
          p_price_list_id: string
          p_valid_from: string
          p_valid_to?: string
          p_variant_id: string
        }
        Returns: string
      }
      create_product_with_initial_setup: {
        Args: {
          p_idempotency_key: string
          p_organization_id: string
          p_payload: Json
        }
        Returns: Json
      }
      create_product_with_retail_fiscal_setup: {
        Args: {
          p_idempotency_key: string
          p_organization_id: string
          p_payload: Json
        }
        Returns: Json
      }
      create_purchase_return: {
        Args: {
          p_goods_receipt_id: string
          p_notes?: string
          p_organization_id: string
          p_reason: string
        }
        Returns: {
          completion_idempotency_key: string | null
          created_at: string
          created_by: string
          goods_receipt_id: string
          id: string
          notes: string | null
          number: string
          organization_id: string
          purchase_order_id: string
          reason: string
          returned_at: string | null
          status: string
          supplier_id: string
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "purchase_return"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_quotation: {
        Args: {
          p_currency: string
          p_customer: string
          p_items: Json
          p_notes: string
          p_org: string
          p_valid_until: string
        }
        Returns: string
      }
      create_receivable: {
        Args: {
          p_currency: string
          p_customer_id: string
          p_due_date: string
          p_installments: Json
          p_issue_date: string
          p_notes: string
          p_organization_id: string
          p_origin_id?: string
          p_origin_type?: string
          p_total: number
        }
        Returns: string
      }
      create_sales_order: {
        Args: {
          p_currency: string
          p_customer: string
          p_items: Json
          p_notes: string
          p_org: string
          p_quotation?: string
        }
        Returns: string
      }
      create_sales_order_with_commercial_context: {
        Args: {
          p_branch?: string
          p_currency: string
          p_customer: string
          p_items: Json
          p_notes: string
          p_org: string
          p_payment_method?: string
          p_payment_term?: string
          p_quotation?: string
          p_seller?: string
        }
        Returns: string
      }
      create_sales_order_with_context: {
        Args: {
          p_branch?: string
          p_currency: string
          p_customer: string
          p_items: Json
          p_notes: string
          p_org: string
          p_payment_term?: string
          p_quotation?: string
        }
        Returns: string
      }
      create_sales_receivable_from_order: {
        Args: { p_org: string; p_sales_order: string }
        Returns: string
      }
      create_seller: {
        Args: {
          p_bonus_amount: number
          p_bonus_target_percentage: number
          p_branch: string
          p_commission_rate: number
          p_full_name: string
          p_org: string
          p_salary_amount: number
          p_short_name: string
          p_user: string
        }
        Returns: string
      }
      create_tax_profile: {
        Args: {
          p_cfop?: string
          p_code: string
          p_csosn?: string
          p_cst?: string
          p_name: string
          p_ncm?: string
          p_org: string
          p_origin?: string
        }
        Returns: {
          cfop: string | null
          code: string
          created_at: string
          created_by: string
          csosn: string | null
          cst: string | null
          id: string
          name: string
          ncm: string | null
          organization_id: string
          origin: string | null
          status: string
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "tax_profile"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      dispatch_inventory_shipment: {
        Args: {
          p_idempotency_key?: string
          p_org: string
          p_shipment_id: string
        }
        Returns: string
      }
      ensure_customer_acquisition_sources: {
        Args: { p_actor: string; p_org: string }
        Returns: undefined
      }
      ensure_default_branch: {
        Args: { p_actor?: string; p_org: string }
        Returns: string
      }
      ensure_default_cash_account: { Args: { p_org: string }; Returns: string }
      finance_has_permission: {
        Args: { p_org: string; p_permission: string }
        Returns: boolean
      }
      finance_next_ledger_number: { Args: { p_org: string }; Returns: string }
      finance_record_audit: {
        Args: {
          p_action: string
          p_id: string
          p_org: string
          p_payload: Json
          p_type: string
        }
        Returns: undefined
      }
      finance_record_cash_ledger: {
        Args: {
          p_account: string
          p_amount: number
          p_branch: string
          p_company: string
          p_correlation: string
          p_description: string
          p_entry_type: string
          p_idempotency: string
          p_occurred_at: string
          p_org: string
          p_payment_id: string
          p_reversal_of: string
          p_source_id: string
          p_source_type: string
          p_transfer_id: string
        }
        Returns: string
      }
      finance_require_branch: {
        Args: { p_branch: string; p_org: string }
        Returns: string
      }
      find_active_fiscal_document: {
        Args: { p_org: string; p_source_id: string; p_source_type: string }
        Returns: {
          created_at: string
          created_by: string
          document_type: string
          id: string
          internal_number: string
          occurred_at: string
          operation_id: string
          organization_id: string
          responsible_user_id: string
          source_document: string | null
          source_id: string | null
          source_type: string | null
          status: string
          tax_profile_id: string
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "fiscal_document"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fiscal_has_permission: {
        Args: { p_org: string; p_permission: string }
        Returns: boolean
      }
      fiscal_source_metadata_has_permission: {
        Args: { p_org: string; p_permission: string }
        Returns: boolean
      }
      fundamental_has_permission: {
        Args: { p_org: string; p_permission: string }
        Returns: boolean
      }
      fundamental_record_audit: {
        Args: {
          p_action: string
          p_after?: Json
          p_before?: Json
          p_id: string
          p_org: string
          p_type: string
        }
        Returns: undefined
      }
      fundamental_require_permission: {
        Args: { p_org: string; p_permission: string }
        Returns: undefined
      }
      get_analytics_kpis: {
        Args: { p_branch?: string; p_from: string; p_org: string; p_to: string }
        Returns: Json
      }
      get_analytics_operational_feed: {
        Args: { p_branch?: string; p_limit?: number; p_org: string }
        Returns: Json
      }
      get_analytics_ranking: {
        Args: {
          p_branch?: string
          p_dimension: string
          p_from: string
          p_limit?: number
          p_org: string
          p_to: string
        }
        Returns: Json
      }
      get_analytics_time_series: {
        Args: {
          p_branch?: string
          p_from: string
          p_grain?: string
          p_org: string
          p_to: string
        }
        Returns: Json
      }
      get_checkout_result: { Args: { p_public_token: string }; Returns: Json }
      get_checkout_session_public: {
        Args: { p_public_token: string }
        Returns: Json
      }
      get_executive_dashboard: {
        Args: { p_organization_id: string; p_period?: string }
        Returns: Json
      }
      get_finance_cash_flow: {
        Args: {
          p_account?: string
          p_branch?: string
          p_from?: string
          p_grain?: string
          p_org: string
          p_to?: string
        }
        Returns: Json
      }
      get_inventory_packing: {
        Args: { p_org: string; p_packing_id: string }
        Returns: Json
      }
      get_inventory_picking: {
        Args: { p_org: string; p_picking_id: string }
        Returns: Json
      }
      get_inventory_policy: {
        Args: { p_org: string }
        Returns: {
          allow_confirmation_without_stock: boolean
          allow_negative_stock: boolean
          allow_partial_reservation: boolean
          automatic_reservation: boolean
          automatic_stock_decrease: boolean
          created_at: string
          created_by: string
          organization_id: string
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "inventory_policy"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_inventory_reservation: {
        Args: { p_org: string; p_reservation_id: string }
        Returns: Json
      }
      get_inventory_shipment: {
        Args: { p_org: string; p_shipment_id: string }
        Returns: Json
      }
      get_payment: {
        Args: { p_organization_id: string; p_payment_id: string }
        Returns: Json
      }
      get_receivable: {
        Args: { p_id: string; p_organization_id: string }
        Returns: Json
      }
      get_sales_document: {
        Args: { p_id: string; p_org: string; p_type: string }
        Returns: Json
      }
      inventory_has_permission: {
        Args: { p_org: string; p_permission: string }
        Returns: boolean
      }
      inventory_ledger_delta: {
        Args: { p_quantity: number; p_type: string }
        Returns: number
      }
      inventory_movement_delta: {
        Args: { p_quantity: number; p_type: string }
        Returns: number
      }
      inventory_record_audit: {
        Args: {
          p_action: string
          p_after?: Json
          p_aggregate_id: string
          p_aggregate_type: string
          p_before?: Json
          p_correlation_id?: string
          p_org: string
          p_payload?: Json
          p_reason?: string
        }
        Returns: undefined
      }
      inventory_require_permission: {
        Args: { p_org: string; p_permission: string }
        Returns: undefined
      }
      is_org_member: { Args: { p_organization_id: string }; Returns: boolean }
      is_org_owner: { Args: { p_organization_id: string }; Returns: boolean }
      list_branches: {
        Args: { p_org: string; p_status?: string }
        Returns: {
          archived_at: string | null
          archived_by: string | null
          code: string
          created_at: string
          created_by: string
          id: string
          is_default: boolean
          name: string
          organization_id: string
          status: string
          updated_at: string
          updated_by: string
        }[]
        SetofOptions: {
          from: "*"
          to: "branch"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_financial_accounts: {
        Args: { p_organization_id: string }
        Returns: {
          active: boolean
          created_at: string
          created_by: string
          id: string
          name: string
          organization_id: string
          type: string
          updated_at: string
          updated_by: string
        }[]
        SetofOptions: {
          from: "*"
          to: "financial_account"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_inventory_packings: {
        Args: {
          p_limit?: number
          p_org: string
          p_query?: string
          p_status?: string
        }
        Returns: {
          created_at: string
          customer_document: string | null
          customer_name: string
          number: string
          organization_id: string
          packing_date: string
          packing_id: string
          picking_id: string
          picking_number: string
          reservation_id: string
          reservation_number: string
          search_text: string
          source_id: string
          source_number: string
          source_type: string
          status: string
          total_quantity_picked: number
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "inventory_packing_search"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_inventory_pickings: {
        Args: {
          p_limit?: number
          p_org: string
          p_query?: string
          p_status?: string
        }
        Returns: {
          created_at: string
          customer_document: string | null
          customer_name: string
          number: string
          organization_id: string
          picking_date: string
          picking_id: string
          reservation_id: string
          reservation_number: string
          search_text: string
          source_id: string
          source_number: string
          source_type: string
          status: string
          total_quantity_picked: number
          total_quantity_reserved: number
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "inventory_picking_search"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_inventory_reservations: {
        Args: {
          p_limit?: number
          p_org: string
          p_query?: string
          p_status?: string
        }
        Returns: {
          created_at: string
          customer_document: string | null
          customer_name: string
          number: string
          organization_id: string
          reservation_date: string
          reservation_id: string
          search_text: string
          source_id: string
          source_number: string
          source_type: string
          status: string
          total_quantity_released: number
          total_quantity_reserved: number
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "inventory_reservation_search"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_inventory_shipments: {
        Args: {
          p_limit?: number
          p_org: string
          p_query?: string
          p_status?: string
        }
        Returns: {
          carrier: string | null
          created_at: string
          customer_document: string | null
          customer_name: string
          delivered_date: string | null
          dispatch_date: string | null
          number: string
          organization_id: string
          packing_id: string
          packing_number: string
          picking_id: string
          picking_number: string
          reservation_id: string
          reservation_number: string
          search_text: string
          service: string | null
          shipment_date: string
          shipment_id: string
          source_id: string
          source_number: string
          source_type: string
          status: string
          total_quantity_packed: number
          total_quantity_shipped: number
          tracking_code: string | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "inventory_shipment_search"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_payment_methods: {
        Args: { p_org: string }
        Returns: {
          archived_at: string | null
          archived_by: string | null
          code: string
          created_at: string
          created_by: string
          id: string
          is_default: boolean
          kind: string
          name: string
          organization_id: string
          status: string
          updated_at: string
          updated_by: string
        }[]
        SetofOptions: {
          from: "*"
          to: "payment_method"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_payment_terms: {
        Args: { p_org: string; p_status?: string }
        Returns: {
          archived_at: string | null
          archived_by: string | null
          code: string
          created_at: string
          created_by: string
          id: string
          is_default: boolean
          kind: string
          name: string
          organization_id: string
          status: string
          updated_at: string
          updated_by: string
        }[]
        SetofOptions: {
          from: "*"
          to: "payment_term"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_payments: {
        Args: {
          p_financial_account_id?: string
          p_from?: string
          p_limit?: number
          p_method?: string
          p_organization_id: string
          p_query?: string
          p_status?: string
          p_supplier_id?: string
          p_to?: string
        }
        Returns: {
          external_reference: string | null
          financial_account_id: string | null
          financial_account_name: string | null
          method: string
          net_amount: number
          organization_id: string
          paid_at: string
          payment_id: string
          search_text: string
          status: string
          supplier_id: string | null
          supplier_legal_name: string | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "payment_search"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_price_list_items: {
        Args: {
          p_organization_id: string
          p_page?: number
          p_page_size?: number
          p_price_list_id?: string
          p_product_id?: string
          p_search?: string
          p_status?: string
          p_variant_id?: string
        }
        Returns: Json
      }
      list_price_lists: {
        Args: {
          p_organization_id: string
          p_page?: number
          p_page_size?: number
          p_search?: string
          p_status?: string
        }
        Returns: Json
      }
      list_receivables: {
        Args: {
          p_due_from?: string
          p_due_to?: string
          p_limit?: number
          p_organization_id: string
          p_query?: string
          p_status?: string
        }
        Returns: {
          accounts_receivable_id: string
          currency: string
          customer_document: string | null
          customer_id: string
          customer_name: string
          due_date: string
          number: string
          open_amount: number
          organization_id: string
          paid_amount: number
          search_text: string
          status: string
          total_amount: number
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "accounts_receivable_search"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_sales_documents: {
        Args: {
          p_limit?: number
          p_org: string
          p_query?: string
          p_status?: string
          p_type: string
        }
        Returns: {
          aggregate_id: string
          aggregate_type: string
          created_at: string
          currency: string
          customer_document: string | null
          customer_name: string
          grand_total: number
          issue_date: string
          number: string
          organization_id: string
          quotation_number: string | null
          search_text: string
          status: string
          updated_at: string
          valid_until: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "sales_search"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      list_seller_members: {
        Args: { p_org: string }
        Returns: {
          role: string
          user_id: string
        }[]
      }
      list_sellers: {
        Args: { p_org: string }
        Returns: {
          branch_id: string
          full_name: string
          id: string
          short_name: string
          status: string
          user_id: string
        }[]
      }
      list_sellers_for_management: {
        Args: { p_org: string }
        Returns: {
          archived_at: string | null
          archived_by: string | null
          bonus_amount: number
          bonus_target_percentage: number
          branch_id: string | null
          commission_rate: number
          created_at: string
          created_by: string
          full_name: string
          id: string
          organization_id: string
          salary_amount: number
          short_name: string
          status: string
          updated_at: string
          updated_by: string
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "seller"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      mark_inventory_shipment_ready: {
        Args: {
          p_carrier?: string
          p_estimated_delivery_date?: string
          p_freight_amount?: number
          p_notes?: string
          p_org: string
          p_service?: string
          p_shipment_id: string
          p_tracking_code?: string
        }
        Returns: string
      }
      open_receivable: {
        Args: { p_id: string; p_organization_id: string }
        Returns: string
      }
      packing_has_permission: {
        Args: { p_org: string; p_permission: string }
        Returns: boolean
      }
      packing_record_audit: {
        Args: { p_action: string; p_id: string; p_org: string; p_payload: Json }
        Returns: undefined
      }
      packing_require_permission: {
        Args: { p_org: string; p_permission: string }
        Returns: undefined
      }
      picking_has_permission: {
        Args: { p_org: string; p_permission: string }
        Returns: boolean
      }
      picking_record_audit: {
        Args: { p_action: string; p_id: string; p_org: string; p_payload: Json }
        Returns: undefined
      }
      picking_require_permission: {
        Args: { p_org: string; p_permission: string }
        Returns: undefined
      }
      post_cash_entry: {
        Args: { p_entry: string; p_idempotency: string; p_org: string }
        Returns: {
          account_id: string
          amount: number
          branch_id: string | null
          company_id: string | null
          correlation_id: string | null
          created_at: string
          created_by: string
          description: string
          entry_type: string
          id: string
          ledger_idempotency_key: string | null
          number: string
          occurred_at: string
          organization_id: string
          origin: string
          payment_id: string | null
          post_idempotency_key: string | null
          reversal_of_entry_id: string | null
          source_document: string | null
          source_id: string | null
          status: string
          transfer_id: string | null
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "cash_entry"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      post_finance_payment: {
        Args: {
          p_allocations: Json
          p_amount: number
          p_branch: string
          p_cash_account: string
          p_idempotency?: string
          p_method: string
          p_occurred_at: string
          p_org: string
          p_reference?: string
          p_type: string
        }
        Returns: string
      }
      post_goods_receipt: {
        Args: {
          p_allow_over_receive?: boolean
          p_goods_receipt_id: string
          p_idempotency_key: string
          p_organization_id: string
        }
        Returns: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          created_by: string
          id: string
          location_id: string | null
          notes: string | null
          number: string
          organization_id: string
          post_idempotency_key: string | null
          previous_status: string | null
          purchase_number: string
          purchase_order_id: string
          received_at: string | null
          status: string
          supplier_document: string | null
          supplier_id: string
          supplier_legal_name: string
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "goods_receipt"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      prepare_fiscal_document: {
        Args: { p_document: string; p_org: string }
        Returns: {
          created_at: string
          created_by: string
          document_type: string
          id: string
          internal_number: string
          occurred_at: string
          operation_id: string
          organization_id: string
          responsible_user_id: string
          source_document: string | null
          source_id: string | null
          source_type: string | null
          status: string
          tax_profile_id: string
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "fiscal_document"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      pricing_has_permission: {
        Args: { p_org: string; p_permission: string }
        Returns: boolean
      }
      pricing_record_audit: {
        Args: {
          p_action: string
          p_actor: string
          p_after?: Json
          p_before?: Json
          p_id: string
          p_org: string
          p_type: string
        }
        Returns: undefined
      }
      pricing_refresh_projection: {
        Args: { p_entry_id: string }
        Returns: undefined
      }
      pricing_require_permission: {
        Args: { p_org: string; p_permission: string }
        Returns: undefined
      }
      product_creation_require_permission: {
        Args: { p_org: string }
        Returns: undefined
      }
      provision_checkout_session: {
        Args: {
          p_idempotency_key: string
          p_owner_user_id: string
          p_public_token: string
        }
        Returns: Json
      }
      publish_payment_to_cash: {
        Args: { p_payment_id: string }
        Returns: string
      }
      publish_receivable_settlement_to_cash: {
        Args: { p_receivable_id: string }
        Returns: string
      }
      purchase_returns_has_permission: {
        Args: { p_org: string; p_permission: string }
        Returns: boolean
      }
      purchasing_has_permission: {
        Args: { p_organization_id: string; p_permission: string }
        Returns: boolean
      }
      reconcile_inventory_ledger: {
        Args: { p_only_inconsistent?: boolean; p_organization_id: string }
        Returns: {
          difference: number
          inventory_item_id: string
          issues: string[]
          ledger_quantity: number
          location_id: string
          movement_count: number
          organization_id: string
          projected_quantity: number
          variant_id: string
        }[]
      }
      record_checkout_failure: {
        Args: { p_public_token: string; p_reason: string }
        Returns: undefined
      }
      refresh_accounts_payable_search: {
        Args: { p_accounts_payable_id: string }
        Returns: undefined
      }
      refresh_cash_flow_search: { Args: { p_id: string }; Returns: undefined }
      refresh_checkout_search: {
        Args: { p_checkout_id: string }
        Returns: undefined
      }
      refresh_customer_search: {
        Args: { p_customer_id: string }
        Returns: undefined
      }
      refresh_fiscal_document_search: {
        Args: { p_id: string }
        Returns: undefined
      }
      refresh_fiscal_search: {
        Args: { p_id: string; p_type: string }
        Returns: undefined
      }
      refresh_fiscal_source_metadata_search: {
        Args: { p_id: string }
        Returns: undefined
      }
      refresh_goods_receipt_search: {
        Args: { p_goods_receipt_id: string }
        Returns: undefined
      }
      refresh_inventory_packing_search: {
        Args: { p_packing_id: string }
        Returns: undefined
      }
      refresh_inventory_picking_search: {
        Args: { p_picking_id: string }
        Returns: undefined
      }
      refresh_inventory_reservation_search: {
        Args: { p_reservation_id: string }
        Returns: undefined
      }
      refresh_inventory_shipment_search: {
        Args: { p_shipment_id: string }
        Returns: undefined
      }
      refresh_payment_search: {
        Args: { p_payment_id: string }
        Returns: undefined
      }
      refresh_purchase_return_search: {
        Args: { p_return_id: string }
        Returns: undefined
      }
      refresh_purchase_search: {
        Args: { p_purchase_order_id: string }
        Returns: undefined
      }
      refresh_receivable_search: { Args: { p_id: string }; Returns: undefined }
      refresh_sales_search: {
        Args: { p_id: string; p_type: string }
        Returns: undefined
      }
      refresh_supplier_search: {
        Args: { p_supplier_id: string }
        Returns: undefined
      }
      register_inventory_ledger_movement: {
        Args: {
          p_correlation_id?: string
          p_idempotency_key?: string
          p_location_id: string
          p_notes?: string
          p_occurred_at?: string
          p_organization_id: string
          p_quantity: number
          p_reason: string
          p_reference_id?: string
          p_reference_type?: string
          p_reverses_movement_id?: string
          p_signed_delta?: number
          p_type: string
          p_variant_id: string
        }
        Returns: {
          after_quantity: number
          before_quantity: number
          correlation_id: string | null
          created_at: string
          created_by: string
          id: string
          idempotency_key: string | null
          inventory_item_id: string
          location_id: string
          notes: string | null
          occurred_at: string
          organization_id: string
          quantity: number
          reason: string
          reference_id: string | null
          reference_type: string | null
          reverses_movement_id: string | null
          signed_delta: number
          type: string
          variant_id: string
        }
        SetofOptions: {
          from: "*"
          to: "inventory_ledger_movement"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      register_inventory_ledger_transfer: {
        Args: {
          p_from_location_id: string
          p_idempotency_key?: string
          p_notes?: string
          p_occurred_at?: string
          p_organization_id: string
          p_quantity: number
          p_reason: string
          p_to_location_id: string
          p_variant_id: string
        }
        Returns: {
          after_quantity: number
          before_quantity: number
          correlation_id: string | null
          created_at: string
          created_by: string
          id: string
          idempotency_key: string | null
          inventory_item_id: string
          location_id: string
          notes: string | null
          occurred_at: string
          organization_id: string
          quantity: number
          reason: string
          reference_id: string | null
          reference_type: string | null
          reverses_movement_id: string | null
          signed_delta: number
          type: string
          variant_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "inventory_ledger_movement"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      register_inventory_movement: {
        Args: {
          p_notes?: string
          p_occurred_at?: string
          p_organization_id: string
          p_product_id: string
          p_quantity: number
          p_reason: string
          p_reference_id?: string
          p_reference_type?: string
          p_type: string
        }
        Returns: {
          created_at: string
          created_by: string
          id: string
          notes: string | null
          occurred_at: string
          organization_id: string
          product_id: string
          quantity: number
          reason: string
          reference_id: string | null
          reference_type: string | null
          type: string
        }
        SetofOptions: {
          from: "*"
          to: "inventory_movement"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      release_inventory_reservation: {
        Args: {
          p_items?: Json
          p_org: string
          p_reason?: string
          p_reservation_id: string
        }
        Returns: string
      }
      remove_price_list_item: {
        Args: { p_item_id: string; p_organization_id: string }
        Returns: undefined
      }
      reservation_has_permission: {
        Args: { p_org: string; p_permission: string }
        Returns: boolean
      }
      reservation_record_audit: {
        Args: { p_action: string; p_id: string; p_org: string; p_payload: Json }
        Returns: undefined
      }
      reservation_require_permission: {
        Args: { p_org: string; p_permission: string }
        Returns: undefined
      }
      resolve_fiscal_rule: {
        Args: {
          p_destination_state: string
          p_operation_id: string
          p_organization_id: string
          p_origin_state: string
          p_tax_profile_id: string
          p_variant_id: string
        }
        Returns: Json
      }
      resolve_payment_term: {
        Args: {
          p_issue_date: string
          p_org: string
          p_term: string
          p_total: number
        }
        Returns: {
          amount: number
          due_date: string
          is_immediate: boolean
          percentage: number
          sequence: number
        }[]
      }
      resolve_price: {
        Args: {
          p_at?: string
          p_organization_id: string
          p_price_list_id: string
          p_variant_id: string
        }
        Returns: Json
      }
      reverse_cash_entry: {
        Args: { p_entry: string; p_org: string }
        Returns: {
          account_id: string
          amount: number
          branch_id: string | null
          company_id: string | null
          correlation_id: string | null
          created_at: string
          created_by: string
          description: string
          entry_type: string
          id: string
          ledger_idempotency_key: string | null
          number: string
          occurred_at: string
          organization_id: string
          origin: string
          payment_id: string | null
          post_idempotency_key: string | null
          reversal_of_entry_id: string | null
          source_document: string | null
          source_id: string | null
          status: string
          transfer_id: string | null
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "cash_entry"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reverse_finance_payment: {
        Args: {
          p_idempotency: string
          p_org: string
          p_payment: string
          p_reason: string
        }
        Returns: string
      }
      reverse_payment: {
        Args: {
          p_idempotency_key: string
          p_organization_id: string
          p_payment_id: string
          p_reason: string
        }
        Returns: string
      }
      sales_has_permission: {
        Args: { p_org: string; p_permission: string }
        Returns: boolean
      }
      sales_normalize_currency: {
        Args: { p_currency: string }
        Returns: string
      }
      sales_order_stock_is_reservable: {
        Args: { p_org: string; p_sales_order: string }
        Returns: boolean
      }
      sales_record_audit: {
        Args: {
          p_action: string
          p_id: string
          p_org: string
          p_payload: Json
          p_type: string
        }
        Returns: undefined
      }
      sales_require_permission: {
        Args: { p_org: string; p_permission: string }
        Returns: undefined
      }
      sales_resolve_branch: {
        Args: { p_branch?: string; p_org: string }
        Returns: string
      }
      sales_resolve_item_snapshots: {
        Args: {
          p_allow_manual: boolean
          p_currency: string
          p_items: Json
          p_org: string
        }
        Returns: {
          currency: string
          discount: number
          item_search_text: string
          price_list_id: string
          price_rule_snapshot: Json
          price_source: string
          product_id: string
          product_name: string
          quantity: number
          sku: string
          sort_order: number
          subtotal: number
          total: number
          unit_code: string
          unit_price: number
          variant_description: string
          variant_id: string
        }[]
      }
      sales_validate_payment_term: {
        Args: { p_org: string; p_term: string }
        Returns: Json
      }
      search_pricing_variants: {
        Args: { p_limit?: number; p_organization_id: string; p_search: string }
        Returns: Json
      }
      set_default_branch: {
        Args: { p_branch: string; p_org: string }
        Returns: undefined
      }
      settle_receivable: {
        Args: { p_organization_id: string; p_receivable_id: string }
        Returns: {
          archived_at: string | null
          branch_id: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          company_id: string | null
          created_at: string
          created_by: string
          currency: string
          customer_document: string | null
          customer_email: string | null
          customer_id: string
          customer_name: string
          customer_phone: string | null
          due_date: string
          id: string
          issue_date: string
          notes: string | null
          number: string
          open_amount: number
          organization_id: string
          origin_id: string | null
          origin_type: string
          paid_amount: number
          status: string
          total_amount: number
          updated_at: string
          updated_by: string
        }
        SetofOptions: {
          from: "*"
          to: "accounts_receivable"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      shipment_has_permission: {
        Args: { p_org: string; p_permission: string }
        Returns: boolean
      }
      shipment_record_audit: {
        Args: { p_action: string; p_id: string; p_org: string; p_payload: Json }
        Returns: undefined
      }
      shipment_require_permission: {
        Args: { p_org: string; p_permission: string }
        Returns: undefined
      }
      slugify_organization_name: { Args: { p_name: string }; Returns: string }
      start_checkout_session: {
        Args: {
          p_billing_cycle: string
          p_country: string
          p_currency: string
          p_language: string
          p_organization_name: string
          p_owner_email: string
          p_owner_name: string
          p_phone: string
          p_public_token: string
          p_selected_plan: string
          p_terms_accepted: boolean
        }
        Returns: Json
      }
      start_inventory_packing: {
        Args: { p_org: string; p_packing_id: string }
        Returns: string
      }
      start_inventory_picking: {
        Args: { p_org: string; p_picking_id: string }
        Returns: string
      }
      transition_quotation: {
        Args: { p_id: string; p_org: string; p_reason?: string; p_to: string }
        Returns: string
      }
      transition_sales_order: {
        Args: { p_id: string; p_org: string; p_reason?: string; p_to: string }
        Returns: string
      }
      update_branch: {
        Args: {
          p_branch: string
          p_code: string
          p_name: string
          p_org: string
        }
        Returns: undefined
      }
      update_inventory_picking_items: {
        Args: {
          p_items: Json
          p_org: string
          p_picking_id: string
          p_reason?: string
        }
        Returns: string
      }
      update_payment_term: {
        Args: {
          p_code: string
          p_installments: Json
          p_kind: string
          p_name: string
          p_org: string
          p_term: string
        }
        Returns: undefined
      }
      update_price_list: {
        Args: {
          p_code: string
          p_name: string
          p_organization_id: string
          p_price_list_id: string
          p_valid_from: string
          p_valid_to?: string
        }
        Returns: undefined
      }
      update_price_list_item: {
        Args: {
          p_amount: number
          p_item_id: string
          p_minimum_amount: number
          p_organization_id: string
          p_valid_from: string
          p_valid_to?: string
        }
        Returns: undefined
      }
      update_quotation: {
        Args: {
          p_currency: string
          p_id: string
          p_items: Json
          p_notes: string
          p_org: string
          p_valid_until: string
        }
        Returns: string
      }
      update_receivable: {
        Args: {
          p_due_date: string
          p_id: string
          p_issue_date: string
          p_notes: string
          p_organization_id: string
        }
        Returns: string
      }
      update_sales_order: {
        Args: {
          p_currency: string
          p_id: string
          p_items: Json
          p_notes: string
          p_org: string
        }
        Returns: string
      }
      update_sales_order_with_commercial_context: {
        Args: {
          p_branch?: string
          p_currency: string
          p_id: string
          p_items: Json
          p_notes: string
          p_org: string
          p_payment_method?: string
          p_payment_term?: string
          p_seller?: string
        }
        Returns: string
      }
      update_sales_order_with_context: {
        Args: {
          p_branch?: string
          p_currency: string
          p_id: string
          p_items: Json
          p_notes: string
          p_org: string
          p_payment_term?: string
        }
        Returns: string
      }
      upsert_inventory_policy: {
        Args: {
          p_allow_negative: boolean
          p_allow_partial: boolean
          p_allow_without_stock: boolean
          p_auto_decrease: boolean
          p_auto_reservation: boolean
          p_org: string
        }
        Returns: undefined
      }
      validate_fiscal_source_metadata: {
        Args: { p_id: string; p_org: string }
        Returns: {
          created_at: string
          created_by: string
          destination_state: string
          fiscal_date: string
          fiscal_operation_id: string
          id: string
          metadata: Json
          organization_id: string
          origin_state: string
          responsible_user_id: string
          source_id: string
          source_number: string
          source_type: string
          status: string
          supersedes_id: string | null
          tax_profile_id: string
          updated_at: string
          updated_by: string
          version: number
        }
        SetofOptions: {
          from: "*"
          to: "fiscal_source_metadata"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

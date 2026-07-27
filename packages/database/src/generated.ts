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
      attribute_definition: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          created_by: string
          id: string
          name: string
          normalized_name: string
          organization_id: string
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
          name: string
          normalized_name: string
          organization_id: string
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
          name?: string
          normalized_name?: string
          organization_id?: string
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
      brand: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          created_by: string
          id: string
          name: string
          normalized_name: string
          organization_id: string
          status: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by: string
          id?: string
          name: string
          normalized_name: string
          organization_id: string
          status?: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          normalized_name?: string
          organization_id?: string
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
      category: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          created_by: string
          depth: number
          id: string
          name: string
          normalized_name: string
          organization_id: string
          parent_id: string | null
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
          id?: string
          name: string
          normalized_name: string
          organization_id: string
          parent_id?: string | null
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
          id?: string
          name?: string
          normalized_name?: string
          organization_id?: string
          parent_id?: string | null
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
      customer: {
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
            foreignKeyName: "customer_organization_id_fkey"
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
          customer_id: string
          document_digits: string | null
          email: string | null
          legal_name: string
          organization_id: string
          phone: string | null
          search_text: string
          status: string
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          customer_id: string
          document_digits?: string | null
          email?: string | null
          legal_name: string
          organization_id: string
          phone?: string | null
          search_text?: string
          status: string
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          customer_id?: string
          document_digits?: string | null
          email?: string | null
          legal_name?: string
          organization_id?: string
          phone?: string | null
          search_text?: string
          status?: string
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: [
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
      accounts_payable: {
        Row: {
          archived_at: string | null
          archived_by: string | null
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
          {
            foreignKeyName: "accounts_payable_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_goods_receipt_id_fkey"
            columns: ["goods_receipt_id"]
            isOneToOne: false
            referencedRelation: "goods_receipt"
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
            foreignKeyName: "accounts_payable_search_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
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
            foreignKeyName: "payable_installment_organization_id_fkey"
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
            foreignKeyName: "goods_receipt_item_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
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
          supplier_id: string
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
          supplier_id: string
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
          supplier_id?: string
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
            foreignKeyName: "supplier_address_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_address_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_contact: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string
          supplier_id: string
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
          supplier_id: string
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
          supplier_id?: string
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
            foreignKeyName: "supplier_contact_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_contact_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
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
          supplier_id: string
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
          supplier_id: string
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
          supplier_id?: string
          field_name?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          organization_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_history_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_search: {
        Row: {
          supplier_id: string
          document_digits: string | null
          email: string | null
          legal_name: string
          organization_id: string
          phone: string | null
          search_text: string
          status: string
          trade_name: string | null
          updated_at: string
        }
        Insert: {
          supplier_id: string
          document_digits?: string | null
          email?: string | null
          legal_name: string
          organization_id: string
          phone?: string | null
          search_text?: string
          status: string
          trade_name?: string | null
          updated_at?: string
        }
        Update: {
          supplier_id?: string
          document_digits?: string | null
          email?: string | null
          legal_name?: string
          organization_id?: string
          phone?: string | null
          search_text?: string
          status?: string
          trade_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_search_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: true
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_search_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
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
            referencedRelation: "product"
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
            referencedRelation: "product"
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
            referencedRelation: "inventory_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_item_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
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
        Relationships: []
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
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
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
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
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
          organization_id: string
          price_list_id: string
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
          organization_id: string
          price_list_id: string
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
          organization_id?: string
          price_list_id?: string
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
            foreignKeyName: "purchase_history_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
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
            foreignKeyName: "purchase_item_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_item_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
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
            foreignKeyName: "purchase_order_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "supplier"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
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
            foreignKeyName: "purchase_search_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: true
            referencedRelation: "purchase_order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_search_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization"
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
          option_id: string
          variant_id: string
        }
        Insert: {
          attribute_definition_id: string
          option_id: string
          variant_id: string
        }
        Update: {
          attribute_definition_id?: string
          option_id?: string
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
            referencedRelation: "product"
            referencedColumns: ["id"]
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
      [_ in never]: never
    }
    Functions: {
      allocate_accounts_payable_number: {
        Args: { p_organization_id: string }
        Returns: string
      }
      allocate_goods_receipt_number: {
        Args: { p_organization_id: string }
        Returns: string
      }
      allocate_purchase_number: {
        Args: { p_organization_id: string }
        Returns: string
      }
      compute_product_stock: {
        Args: { p_organization_id: string; p_product_id: string }
        Returns: number
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
      inventory_ledger_delta: {
        Args: { p_quantity: number; p_type: string }
        Returns: number
      }
      inventory_movement_delta: {
        Args: { p_quantity: number; p_type: string }
        Returns: number
      }
      is_org_member: { Args: { p_organization_id: string }; Returns: boolean }
      is_org_owner: { Args: { p_organization_id: string }; Returns: boolean }
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
      refresh_accounts_payable_search: {
        Args: { p_accounts_payable_id: string }
        Returns: undefined
      }
      refresh_goods_receipt_search: {
        Args: { p_goods_receipt_id: string }
        Returns: undefined
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

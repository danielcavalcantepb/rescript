export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      accounts_receivable: {
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
          status: string
          state_registration: string | null
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
          status?: string
          state_registration?: string | null
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
          status?: string
          state_registration?: string | null
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
      branch: {
        Row: { archived_at: string | null; archived_by: string | null; code: string; created_at: string; created_by: string; id: string; is_default: boolean; name: string; organization_id: string; status: string; updated_at: string; updated_by: string }
        Insert: { archived_at?: string | null; archived_by?: string | null; code: string; created_at?: string; created_by: string; id?: string; is_default?: boolean; name: string; organization_id: string; status?: string; updated_at?: string; updated_by: string }
        Update: { archived_at?: string | null; archived_by?: string | null; code?: string; created_at?: string; created_by?: string; id?: string; is_default?: boolean; name?: string; organization_id?: string; status?: string; updated_at?: string; updated_by?: string }
        Relationships: [{ foreignKeyName: "branch_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organization"; referencedColumns: ["id"] }]
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
          confirmation_idempotency_key: string | null
          confirmed_at: string | null
          created_at: string
          created_by: string
          discount_amount: number
          external_reference: string | null
          fee_amount: number
          financial_account_id: string
          financial_account_name: string
          gross_amount: number
          id: string
          interest_amount: number
          method: string
          net_amount: number | null
          notes: string | null
          organization_id: string
          paid_at: string
          penalty_amount: number
          reversal_idempotency_key: string | null
          reversal_reason: string | null
          reversed_at: string | null
          reverses_payment_id: string | null
          status: string
          supplier_id: string
          supplier_legal_name: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          archived_at?: string | null
          confirmation_idempotency_key?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by: string
          discount_amount?: number
          external_reference?: string | null
          fee_amount?: number
          financial_account_id: string
          financial_account_name: string
          gross_amount: number
          id?: string
          interest_amount?: number
          method: string
          net_amount?: number | null
          notes?: string | null
          organization_id: string
          paid_at: string
          penalty_amount?: number
          reversal_idempotency_key?: string | null
          reversal_reason?: string | null
          reversed_at?: string | null
          reverses_payment_id?: string | null
          status?: string
          supplier_id: string
          supplier_legal_name: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          archived_at?: string | null
          confirmation_idempotency_key?: string | null
          confirmed_at?: string | null
          created_at?: string
          created_by?: string
          discount_amount?: number
          external_reference?: string | null
          fee_amount?: number
          financial_account_id?: string
          financial_account_name?: string
          gross_amount?: number
          id?: string
          interest_amount?: number
          method?: string
          net_amount?: number | null
          notes?: string | null
          organization_id?: string
          paid_at?: string
          penalty_amount?: number
          reversal_idempotency_key?: string | null
          reversal_reason?: string | null
          reversed_at?: string | null
          reverses_payment_id?: string | null
          status?: string
          supplier_id?: string
          supplier_legal_name?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
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
          accounts_payable_id: string
          amount: number
          created_at: string
          created_by: string
          id: string
          organization_id: string
          payable_installment_id: string
          payment_id: string
        }
        Insert: {
          accounts_payable_id: string
          amount: number
          created_at?: string
          created_by: string
          id?: string
          organization_id: string
          payable_installment_id: string
          payment_id: string
        }
        Update: {
          accounts_payable_id?: string
          amount?: number
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
          payable_installment_id?: string
          payment_id?: string
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
      payment_search: {
        Row: {
          external_reference: string | null
          financial_account_id: string
          financial_account_name: string
          method: string
          net_amount: number
          organization_id: string
          paid_at: string
          payment_id: string
          search_text: string
          status: string
          supplier_id: string
          supplier_legal_name: string
          updated_at: string
        }
        Insert: {
          external_reference?: string | null
          financial_account_id: string
          financial_account_name: string
          method: string
          net_amount: number
          organization_id: string
          paid_at: string
          payment_id: string
          search_text?: string
          status: string
          supplier_id: string
          supplier_legal_name: string
          updated_at?: string
        }
        Update: {
          external_reference?: string | null
          financial_account_id?: string
          financial_account_name?: string
          method?: string
          net_amount?: number
          organization_id?: string
          paid_at?: string
          payment_id?: string
          search_text?: string
          status?: string
          supplier_id?: string
          supplier_legal_name?: string
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
            foreignKeyName: "product_variant_product_same_org_fk"
            columns: ["organization_id", "product_id"]
            isOneToOne: false
            referencedRelation: "product"
            referencedColumns: ["organization_id", "id"]
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
            referencedRelation: "product"
            referencedColumns: ["id"]
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
          quotation_id: string | null
          status: string
          subtotal: number
          updated_at: string
          updated_by: string
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
          quotation_id?: string | null
          status?: string
          subtotal: number
          updated_at?: string
          updated_by: string
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
          quotation_id?: string | null
          status?: string
          subtotal?: number
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
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
            foreignKeyName: "sales_order_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotation"
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
          created_at: string
          created_by: string
          currency: string
          current_period_end: string | null
          current_period_start: string
          external_billing_ref: string | null
          id: string
          organization_id: string
          plan_version_id: string
          status: string
          trial_ends_at: string | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          billing_cycle: string
          created_at?: string
          created_by: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string
          external_billing_ref?: string | null
          id?: string
          organization_id: string
          plan_version_id: string
          status: string
          trial_ends_at?: string | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          billing_cycle?: string
          created_at?: string
          created_by?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string
          external_billing_ref?: string | null
          id?: string
          organization_id?: string
          plan_version_id?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_plan_version_id_fkey"
            columns: ["plan_version_id"]
            isOneToOne: false
            referencedRelation: "saas_plan_version"
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
      activate_inventory_reservation: {
        Args: { p_org: string; p_reservation_id: string }
        Returns: string
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
      allocate_sales_number: {
        Args: { p_org: string; p_type: string }
        Returns: string
      }
      archive_payment: {
        Args: { p_organization_id: string; p_payment_id: string }
        Returns: string
      }
      archive_receivable: {
        Args: { p_id: string; p_organization_id: string }
        Returns: string
      }
      can_manage_payments: {
        Args: { p_organization_id: string }
        Returns: boolean
      }
      can_manage_receivables: { Args: { p_org: string }; Returns: boolean }
      cancel_checkout_session: {
        Args: { p_public_token: string; p_reason?: string }
        Returns: Json
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
      cancel_receivable: {
        Args: { p_id: string; p_organization_id: string; p_reason: string }
        Returns: string
      }
      catalog_refresh_search_variant: {
        Args: { p_variant_id: string }
        Returns: undefined
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
      create_financial_account: {
        Args: { p_name: string; p_organization_id: string; p_type: string }
        Returns: string
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
      dispatch_inventory_shipment: {
        Args: {
          p_idempotency_key?: string
          p_org: string
          p_shipment_id: string
        }
        Returns: string
      }
      get_checkout_result: { Args: { p_public_token: string }; Returns: Json }
      get_checkout_session_public: {
        Args: { p_public_token: string }
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
          financial_account_id: string
          financial_account_name: string
          method: string
          net_amount: number
          organization_id: string
          paid_at: string
          payment_id: string
          search_text: string
          status: string
          supplier_id: string
          supplier_legal_name: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "payment_search"
          isOneToOne: false
          isSetofReturn: true
        }
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
      provision_checkout_session: {
        Args: {
          p_idempotency_key: string
          p_owner_user_id: string
          p_public_token: string
        }
        Returns: Json
      }
      record_checkout_failure: {
        Args: { p_public_token: string; p_reason: string }
        Returns: undefined
      }
      refresh_accounts_payable_search: {
        Args: { p_accounts_payable_id: string }
        Returns: undefined
      }
      refresh_checkout_search: {
        Args: { p_checkout_id: string }
        Returns: undefined
      }
      refresh_customer_search: {
        Args: { p_customer_id: string }
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
      update_inventory_picking_items: {
        Args: {
          p_items: Json
          p_org: string
          p_picking_id: string
          p_reason?: string
        }
        Returns: string
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
      create_product_with_initial_setup: {
        Args: {
          p_idempotency_key: string
          p_organization_id: string
          p_payload: Json
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

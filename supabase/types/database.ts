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
          created_at?: string
          created_by: string
          currency?: string
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
          created_at?: string
          created_by?: string
          currency?: string
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
      inventory_movement_delta: {
        Args: { p_quantity: number; p_type: string }
        Returns: number
      }
      is_org_member: { Args: { p_organization_id: string }; Returns: boolean }
      is_org_owner: { Args: { p_organization_id: string }; Returns: boolean }
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


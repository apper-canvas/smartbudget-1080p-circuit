const { ApperClient } = window.ApperSDK;

const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const categoryService = {
  async getAll() {
    try {
      const response = await apperClient.fetchRecords('category_c', {
        fields: [
          { field: { Name: "Id" } },
          { field: { Name: "Name" } },
          { field: { Name: "name_c" } },
          { field: { Name: "type_c" } },
          { field: { Name: "color_c" } },
          { field: { Name: "is_custom_c" } }
        ],
        pagingInfo: { limit: 1000, offset: 0 }
      });

      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return response.data || [];
    } catch (error) {
      console.error("Error fetching categories:", error?.response?.data?.message || error);
      return [];
    }
  },

  async getById(id) {
    try {
      const response = await apperClient.getRecordById('category_c', parseInt(id), {
        fields: [
          { field: { Name: "Id" } },
          { field: { Name: "Name" } },
          { field: { Name: "name_c" } },
          { field: { Name: "type_c" } },
          { field: { Name: "color_c" } },
          { field: { Name: "is_custom_c" } }
        ]
      });

      if (!response.success) {
        console.error(response.message);
        return null;
      }

      return response.data || null;
    } catch (error) {
      console.error(`Error fetching category ${id}:`, error?.response?.data?.message || error);
      return null;
    }
  },

  async create(categoryData) {
    try {
      const payload = {
        records: [{
          Name: categoryData.name_c || categoryData.Name,
          name_c: categoryData.name_c,
          type_c: categoryData.type_c,
          color_c: categoryData.color_c,
          is_custom_c: true
        }]
      };

      const response = await apperClient.createRecord('category_c', payload);

      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const failed = response.results.filter(r => !r.success);
        if (failed.length > 0) {
          console.error(`Failed to create category:${JSON.stringify(failed)}`);
          throw new Error(failed[0].message || "Failed to create category");
        }
        return response.results[0].data;
      }

      throw new Error("No response data");
    } catch (error) {
      console.error("Error creating category:", error?.response?.data?.message || error);
      throw error;
    }
  },

  async update(id, categoryData) {
    try {
      const payload = {
        records: [{
          Id: parseInt(id),
          ...(categoryData.Name && { Name: categoryData.Name }),
          ...(categoryData.name_c && { name_c: categoryData.name_c }),
          ...(categoryData.type_c && { type_c: categoryData.type_c }),
          ...(categoryData.color_c && { color_c: categoryData.color_c }),
          ...(categoryData.is_custom_c !== undefined && { is_custom_c: categoryData.is_custom_c })
        }]
      };

      const response = await apperClient.updateRecord('category_c', payload);

      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const failed = response.results.filter(r => !r.success);
        if (failed.length > 0) {
          console.error(`Failed to update category:${JSON.stringify(failed)}`);
          throw new Error(failed[0].message || "Failed to update category");
        }
        return response.results[0].data;
      }

      throw new Error("No response data");
    } catch (error) {
      console.error("Error updating category:", error?.response?.data?.message || error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await apperClient.deleteRecord('category_c', {
        RecordIds: [parseInt(id)]
      });

      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const failed = response.results.filter(r => !r.success);
        if (failed.length > 0) {
          console.error(`Failed to delete category:${JSON.stringify(failed)}`);
          throw new Error(failed[0].message || "Failed to delete category");
        }
      }

      return true;
    } catch (error) {
      console.error("Error deleting category:", error?.response?.data?.message || error);
      throw error;
    }
  },

  async getByType(type) {
    try {
      const response = await apperClient.fetchRecords('category_c', {
        fields: [
          { field: { Name: "Id" } },
          { field: { Name: "Name" } },
          { field: { Name: "name_c" } },
          { field: { Name: "type_c" } },
          { field: { Name: "color_c" } },
          { field: { Name: "is_custom_c" } }
        ],
        where: [
          { FieldName: "type_c", Operator: "EqualTo", Values: [type] }
        ],
        pagingInfo: { limit: 1000, offset: 0 }
      });

      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return response.data || [];
    } catch (error) {
      console.error("Error fetching categories by type:", error?.response?.data?.message || error);
      return [];
    }
  }
};
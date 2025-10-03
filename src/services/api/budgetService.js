const { ApperClient } = window.ApperSDK;

const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const budgetService = {
  async getAll() {
    try {
      const response = await apperClient.fetchRecords('budget_c', {
        fields: [
          { field: { Name: "Id" } },
          { field: { Name: "Name" } },
          { field: { Name: "monthly_limit_c" } },
          { field: { Name: "month_c" } },
          { field: { Name: "year_c" } },
          { field: { name: "category_c" }, referenceField: { field: { Name: "Name" } } }
        ],
        pagingInfo: { limit: 1000, offset: 0 }
      });

      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return response.data || [];
    } catch (error) {
      console.error("Error fetching budgets:", error?.response?.data?.message || error);
      return [];
    }
  },

  async getById(id) {
    try {
      const response = await apperClient.getRecordById('budget_c', parseInt(id), {
        fields: [
          { field: { Name: "Id" } },
          { field: { Name: "Name" } },
          { field: { Name: "monthly_limit_c" } },
          { field: { Name: "month_c" } },
          { field: { Name: "year_c" } },
          { field: { name: "category_c" }, referenceField: { field: { Name: "Name" } } }
        ]
      });

      if (!response.success) {
        console.error(response.message);
        return null;
      }

      return response.data || null;
    } catch (error) {
      console.error(`Error fetching budget ${id}:`, error?.response?.data?.message || error);
      return null;
    }
  },

  async create(budgetData) {
    try {
      const categoryId = typeof budgetData.category_c === 'object'
        ? budgetData.category_c.Id
        : budgetData.category_c;

      const payload = {
        records: [{
          Name: budgetData.Name || `Budget ${budgetData.month_c}`,
          monthly_limit_c: parseFloat(budgetData.monthly_limit_c),
          month_c: budgetData.month_c,
          year_c: parseInt(budgetData.year_c),
          category_c: parseInt(categoryId)
        }]
      };

      const response = await apperClient.createRecord('budget_c', payload);

      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const failed = response.results.filter(r => !r.success);
        if (failed.length > 0) {
          console.error(`Failed to create budget:${JSON.stringify(failed)}`);
          throw new Error(failed[0].message || "Failed to create budget");
        }
        return response.results[0].data;
      }

      throw new Error("No response data");
    } catch (error) {
      console.error("Error creating budget:", error?.response?.data?.message || error);
      throw error;
    }
  },

  async update(id, budgetData) {
    try {
      const categoryId = typeof budgetData.category_c === 'object'
        ? budgetData.category_c.Id
        : budgetData.category_c;

      const payload = {
        records: [{
          Id: parseInt(id),
          ...(budgetData.Name && { Name: budgetData.Name }),
          ...(budgetData.monthly_limit_c !== undefined && { monthly_limit_c: parseFloat(budgetData.monthly_limit_c) }),
          ...(budgetData.month_c && { month_c: budgetData.month_c }),
          ...(budgetData.year_c !== undefined && { year_c: parseInt(budgetData.year_c) }),
          ...(categoryId && { category_c: parseInt(categoryId) })
        }]
      };

      const response = await apperClient.updateRecord('budget_c', payload);

      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const failed = response.results.filter(r => !r.success);
        if (failed.length > 0) {
          console.error(`Failed to update budget:${JSON.stringify(failed)}`);
          throw new Error(failed[0].message || "Failed to update budget");
        }
        return response.results[0].data;
      }

      throw new Error("No response data");
    } catch (error) {
      console.error("Error updating budget:", error?.response?.data?.message || error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await apperClient.deleteRecord('budget_c', {
        RecordIds: [parseInt(id)]
      });

      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const failed = response.results.filter(r => !r.success);
        if (failed.length > 0) {
          console.error(`Failed to delete budget:${JSON.stringify(failed)}`);
          throw new Error(failed[0].message || "Failed to delete budget");
        }
      }

      return true;
    } catch (error) {
      console.error("Error deleting budget:", error?.response?.data?.message || error);
      throw error;
    }
  },

  async getByMonth(monthYear) {
    try {
      const response = await apperClient.fetchRecords('budget_c', {
        fields: [
          { field: { Name: "Id" } },
          { field: { Name: "Name" } },
          { field: { Name: "monthly_limit_c" } },
          { field: { Name: "month_c" } },
          { field: { Name: "year_c" } },
          { field: { name: "category_c" }, referenceField: { field: { Name: "Name" } } }
        ],
        where: [
          { FieldName: "month_c", Operator: "EqualTo", Values: [monthYear] }
        ],
        pagingInfo: { limit: 1000, offset: 0 }
      });

      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return response.data || [];
    } catch (error) {
      console.error("Error fetching budgets by month:", error?.response?.data?.message || error);
      return [];
    }
  },

  async upsertBudget(categoryName, monthlyLimit, month, year) {
    try {
      const categoryResponse = await apperClient.fetchRecords('category_c', {
        fields: [
          { field: { Name: "Id" } },
          { field: { Name: "Name" } }
        ],
        where: [
          { FieldName: "Name", Operator: "EqualTo", Values: [categoryName] }
        ],
        pagingInfo: { limit: 1, offset: 0 }
      });

      if (!categoryResponse.success || !categoryResponse.data || categoryResponse.data.length === 0) {
        throw new Error("Category not found");
      }

      const categoryId = categoryResponse.data[0].Id;

      const existingResponse = await apperClient.fetchRecords('budget_c', {
        fields: [
          { field: { Name: "Id" } }
        ],
        where: [
          { FieldName: "category_c", Operator: "EqualTo", Values: [categoryId] },
          { FieldName: "month_c", Operator: "EqualTo", Values: [month] }
        ],
        pagingInfo: { limit: 1, offset: 0 }
      });

      if (existingResponse.success && existingResponse.data && existingResponse.data.length > 0) {
        return await this.update(existingResponse.data[0].Id, {
          monthly_limit_c: monthlyLimit,
          month_c: month,
          year_c: year,
          category_c: categoryId
        });
      } else {
        return await this.create({
          Name: `${categoryName} - ${month}`,
          category_c: categoryId,
          monthly_limit_c: monthlyLimit,
          month_c: month,
          year_c: year
        });
      }
    } catch (error) {
      console.error("Error upserting budget:", error?.response?.data?.message || error);
      throw error;
    }
  }
};
const { ApperClient } = window.ApperSDK;

const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const transactionService = {
  async getAll() {
    try {
      const response = await apperClient.fetchRecords('transaction_c', {
        fields: [
          { field: { Name: "Id" } },
          { field: { Name: "Name" } },
          { field: { Name: "amount_c" } },
          { field: { Name: "type_c" } },
          { field: { Name: "description_c" } },
          { field: { Name: "date_c" } },
          { field: { Name: "created_at_c" } },
          { field: { name: "category_c" }, referenceField: { field: { Name: "Name" } } }
        ],
        orderBy: [{ fieldName: "date_c", sorttype: "DESC" }],
        pagingInfo: { limit: 1000, offset: 0 }
      });

      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return response.data || [];
    } catch (error) {
      console.error("Error fetching transactions:", error?.response?.data?.message || error);
      return [];
    }
  },

  async getById(id) {
    try {
      const response = await apperClient.getRecordById('transaction_c', parseInt(id), {
        fields: [
          { field: { Name: "Id" } },
          { field: { Name: "Name" } },
          { field: { Name: "amount_c" } },
          { field: { Name: "type_c" } },
          { field: { Name: "description_c" } },
          { field: { Name: "date_c" } },
          { field: { Name: "created_at_c" } },
          { field: { name: "category_c" }, referenceField: { field: { Name: "Name" } } }
        ]
      });

      if (!response.success) {
        console.error(response.message);
        return null;
      }

      return response.data || null;
    } catch (error) {
      console.error(`Error fetching transaction ${id}:`, error?.response?.data?.message || error);
      return null;
    }
  },

  async create(transactionData) {
    try {
      const categoryId = typeof transactionData.category_c === 'object' 
        ? transactionData.category_c.Id 
        : transactionData.category_c;

      const payload = {
        records: [{
          Name: transactionData.description_c || transactionData.Name,
          amount_c: parseFloat(transactionData.amount_c),
          type_c: transactionData.type_c,
          description_c: transactionData.description_c,
          date_c: transactionData.date_c,
          category_c: parseInt(categoryId)
        }]
      };

      const response = await apperClient.createRecord('transaction_c', payload);

      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const failed = response.results.filter(r => !r.success);
        if (failed.length > 0) {
          console.error(`Failed to create transaction:${JSON.stringify(failed)}`);
          throw new Error(failed[0].message || "Failed to create transaction");
        }
        return response.results[0].data;
      }

      throw new Error("No response data");
    } catch (error) {
      console.error("Error creating transaction:", error?.response?.data?.message || error);
      throw error;
    }
  },

  async update(id, transactionData) {
    try {
      const categoryId = typeof transactionData.category_c === 'object'
        ? transactionData.category_c.Id
        : transactionData.category_c;

      const payload = {
        records: [{
          Id: parseInt(id),
          ...(transactionData.Name && { Name: transactionData.Name }),
          ...(transactionData.description_c && { Name: transactionData.description_c, description_c: transactionData.description_c }),
          ...(transactionData.amount_c !== undefined && { amount_c: parseFloat(transactionData.amount_c) }),
          ...(transactionData.type_c && { type_c: transactionData.type_c }),
          ...(transactionData.date_c && { date_c: transactionData.date_c }),
          ...(categoryId && { category_c: parseInt(categoryId) })
        }]
      };

      const response = await apperClient.updateRecord('transaction_c', payload);

      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const failed = response.results.filter(r => !r.success);
        if (failed.length > 0) {
          console.error(`Failed to update transaction:${JSON.stringify(failed)}`);
          throw new Error(failed[0].message || "Failed to update transaction");
        }
        return response.results[0].data;
      }

      throw new Error("No response data");
    } catch (error) {
      console.error("Error updating transaction:", error?.response?.data?.message || error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await apperClient.deleteRecord('transaction_c', {
        RecordIds: [parseInt(id)]
      });

      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const failed = response.results.filter(r => !r.success);
        if (failed.length > 0) {
          console.error(`Failed to delete transaction:${JSON.stringify(failed)}`);
          throw new Error(failed[0].message || "Failed to delete transaction");
        }
      }

      return true;
    } catch (error) {
      console.error("Error deleting transaction:", error?.response?.data?.message || error);
      throw error;
    }
  },

  async getByMonth(monthYear) {
    try {
      const response = await apperClient.fetchRecords('transaction_c', {
        fields: [
          { field: { Name: "Id" } },
          { field: { Name: "Name" } },
          { field: { Name: "amount_c" } },
          { field: { Name: "type_c" } },
          { field: { Name: "description_c" } },
          { field: { Name: "date_c" } },
          { field: { Name: "created_at_c" } },
          { field: { name: "category_c" }, referenceField: { field: { Name: "Name" } } }
        ],
        where: [
          { FieldName: "date_c", Operator: "Contains", Values: [monthYear] }
        ],
        orderBy: [{ fieldName: "date_c", sorttype: "DESC" }],
        pagingInfo: { limit: 1000, offset: 0 }
      });

      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return response.data || [];
    } catch (error) {
      console.error("Error fetching transactions by month:", error?.response?.data?.message || error);
      return [];
    }
  },

  async getByCategory(categoryId) {
    try {
      const response = await apperClient.fetchRecords('transaction_c', {
        fields: [
          { field: { Name: "Id" } },
          { field: { Name: "Name" } },
          { field: { Name: "amount_c" } },
          { field: { Name: "type_c" } },
          { field: { Name: "description_c" } },
          { field: { Name: "date_c" } },
          { field: { Name: "created_at_c" } },
          { field: { name: "category_c" }, referenceField: { field: { Name: "Name" } } }
        ],
        where: [
          { FieldName: "category_c", Operator: "EqualTo", Values: [parseInt(categoryId)] }
        ],
        orderBy: [{ fieldName: "date_c", sorttype: "DESC" }],
        pagingInfo: { limit: 1000, offset: 0 }
      });

      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return response.data || [];
    } catch (error) {
      console.error("Error fetching transactions by category:", error?.response?.data?.message || error);
      return [];
    }
  }
};
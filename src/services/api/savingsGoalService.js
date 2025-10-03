const { ApperClient } = window.ApperSDK;

const apperClient = new ApperClient({
  apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
  apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
});

export const savingsGoalService = {
  async getAll() {
    try {
      const response = await apperClient.fetchRecords('savings_goal_c', {
        fields: [
          { field: { Name: "Id" } },
          { field: { Name: "Name" } },
          { field: { Name: "title_c" } },
          { field: { Name: "target_amount_c" } },
          { field: { Name: "current_amount_c" } },
          { field: { Name: "deadline_c" } },
          { field: { Name: "created_at_c" } }
        ],
        orderBy: [{ fieldName: "deadline_c", sorttype: "ASC" }],
        pagingInfo: { limit: 1000, offset: 0 }
      });

      if (!response.success) {
        console.error(response.message);
        return [];
      }

      return response.data || [];
    } catch (error) {
      console.error("Error fetching savings goals:", error?.response?.data?.message || error);
      return [];
    }
  },

  async getById(id) {
    try {
      const response = await apperClient.getRecordById('savings_goal_c', parseInt(id), {
        fields: [
          { field: { Name: "Id" } },
          { field: { Name: "Name" } },
          { field: { Name: "title_c" } },
          { field: { Name: "target_amount_c" } },
          { field: { Name: "current_amount_c" } },
          { field: { Name: "deadline_c" } },
          { field: { Name: "created_at_c" } }
        ]
      });

      if (!response.success) {
        console.error(response.message);
        return null;
      }

      return response.data || null;
    } catch (error) {
      console.error(`Error fetching savings goal ${id}:`, error?.response?.data?.message || error);
      return null;
    }
  },

  async create(goalData) {
    try {
      const payload = {
        records: [{
          Name: goalData.title_c || goalData.Name,
          title_c: goalData.title_c,
          target_amount_c: parseFloat(goalData.target_amount_c),
          current_amount_c: parseFloat(goalData.current_amount_c || 0),
          deadline_c: goalData.deadline_c
        }]
      };

      const response = await apperClient.createRecord('savings_goal_c', payload);

      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const failed = response.results.filter(r => !r.success);
        if (failed.length > 0) {
          console.error(`Failed to create savings goal:${JSON.stringify(failed)}`);
          throw new Error(failed[0].message || "Failed to create savings goal");
        }
        return response.results[0].data;
      }

      throw new Error("No response data");
    } catch (error) {
      console.error("Error creating savings goal:", error?.response?.data?.message || error);
      throw error;
    }
  },

  async update(id, goalData) {
    try {
      const payload = {
        records: [{
          Id: parseInt(id),
          ...(goalData.Name && { Name: goalData.Name }),
          ...(goalData.title_c && { title_c: goalData.title_c }),
          ...(goalData.target_amount_c !== undefined && { target_amount_c: parseFloat(goalData.target_amount_c) }),
          ...(goalData.current_amount_c !== undefined && { current_amount_c: parseFloat(goalData.current_amount_c) }),
          ...(goalData.deadline_c && { deadline_c: goalData.deadline_c })
        }]
      };

      const response = await apperClient.updateRecord('savings_goal_c', payload);

      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const failed = response.results.filter(r => !r.success);
        if (failed.length > 0) {
          console.error(`Failed to update savings goal:${JSON.stringify(failed)}`);
          throw new Error(failed[0].message || "Failed to update savings goal");
        }
        return response.results[0].data;
      }

      throw new Error("No response data");
    } catch (error) {
      console.error("Error updating savings goal:", error?.response?.data?.message || error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await apperClient.deleteRecord('savings_goal_c', {
        RecordIds: [parseInt(id)]
      });

      if (!response.success) {
        console.error(response.message);
        throw new Error(response.message);
      }

      if (response.results) {
        const failed = response.results.filter(r => !r.success);
        if (failed.length > 0) {
          console.error(`Failed to delete savings goal:${JSON.stringify(failed)}`);
          throw new Error(failed[0].message || "Failed to delete savings goal");
        }
      }

      return true;
    } catch (error) {
      console.error("Error deleting savings goal:", error?.response?.data?.message || error);
      throw error;
    }
  },

  async updateAmount(id, amount) {
    try {
      const currentGoal = await this.getById(id);
      if (!currentGoal) {
        throw new Error("Savings goal not found");
      }

      const newAmount = Math.max(0, (currentGoal.current_amount_c || 0) + amount);

      return await this.update(id, {
        current_amount_c: newAmount
      });
    } catch (error) {
      console.error("Error updating savings goal amount:", error?.response?.data?.message || error);
      throw error;
    }
  }
};
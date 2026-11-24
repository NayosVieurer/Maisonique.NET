using KitchenTable.Models;

namespace KitchenTable.Services.Interfaces;

public interface IMealService
{
    void Save(Guid id, MealInput input);

    void Delete(Guid id, int version);
}

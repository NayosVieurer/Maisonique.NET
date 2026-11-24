using KitchenTable.Models;

namespace KitchenTable.Services.Interfaces;

public interface IRecipeService
{
    void Save(Guid id, RecipeInput input);

    void Delete(Guid id, int version);
}

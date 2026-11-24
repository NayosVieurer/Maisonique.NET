using KitchenTable.Models;

namespace KitchenTable.Services.Interfaces;

public interface IShoppingService
{
    void AddExtra(string week, Guid id, ExtraInput input);

    void DeleteExtra(string week, Guid id);

    void SetDone(string week, string itemId, DoneInput input);
}
